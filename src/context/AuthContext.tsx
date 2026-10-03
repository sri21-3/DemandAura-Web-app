import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  BLUEPRINT_CONSTRAINTS,
  db,
  formatFirebaseAuthError,
  googleProvider,
  handleFirestoreError,
  OperationType,
  sanitizeString,
} from '../firebase';
import {
  AdminRole,
  CanonicalCategory,
  CanonicalCountry,
  ContactInquiry,
  InquiryTopic,
  LoginMethod,
  LoginStatus,
  ModelTypeKey,
  PredictionRecord,
  PredictionStatus,
  UserProfile,
} from '../types/models';

export const MODEL_DISPLAY_NAME_MAP: Record<ModelTypeKey, string> = {
  divergence: 'Demand-to-Hype Divergence Score Predictor (XGBoost)',
  forecast: 'Multi-Week Search Interest Forecaster (LightGBM)',
  segmentation_overall: 'Overall Country-Category Market Segmentation (K-Means k=4)',
  segmentation_4w: '4-Weeks Rolling Market Segmentation (K-Means k=7)',
};

export interface EmailSignUpInput {
  email: string;
  password: string;
  displayName: string;
  organization?: string;
  jobTitle?: string;
  preferredCountry?: CanonicalCountry;
  preferredCategory?: CanonicalCategory;
}

interface AuthContextValue {
  user: User | null;
  uid: string | null;
  profile: UserProfile | null;
  userEmail: string | null;
  isAdmin: boolean;
  adminRole: AdminRole | null;
  isAuthReady: boolean;
  isAuthActionPending: boolean;
  authError: string | null;
  isEmailProviderDisabled: boolean;
  clearAuthError: () => void;
  predictions: PredictionRecord[];
  inquiries: ContactInquiry[];
  recordUserLogin: (
    currentUser: User,
    method?: LoginMethod,
    status?: LoginStatus
  ) => Promise<void>;
  adminQuickSignIn: (email?: string, password?: string) => Promise<void>;
  signUpWithEmail: (input: EmailSignUpInput) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (updates: {
    displayName: string;
    organization: string;
    jobTitle: string;
    preferredCountry: CanonicalCountry;
    preferredCategory: CanonicalCategory;
  }) => Promise<void>;
  logPrediction: (entry: {
    modelType: ModelTypeKey;
    modelDisplayName?: string;
    countryName: string;
    category: string;
    summaryValue: string;
    numericResult: number;
    recordDate: string;
    predictionStatus?: PredictionStatus;
    notes?: string;
  }) => Promise<void>;
  updatePredictionNote: (predictionId: string, notes: string) => Promise<void>;
  deletePrediction: (predictionId: string) => Promise<void>;
  submitContactInquiry: (inquiry: {
    senderName: string;
    organization: string;
    topic: InquiryTopic;
    message: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function formatTimestamp(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthActionPending, setIsAuthActionPending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEmailProviderDisabled, setIsEmailProviderDisabled] = useState(false);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);

  const clearAuthError = () => {
    setAuthError(null);
    setIsEmailProviderDisabled(false);
  };

  // Record audit log entry in /userLogins for administrator monitoring
  async function recordUserLogin(
    currentUser: User,
    method: LoginMethod = 'password',
    status: LoginStatus = 'success'
  ) {
    try {
      const userAgent = (
        typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
      ).slice(0, 300);
      const platform = (
        typeof navigator !== 'undefined' ? navigator.platform || 'Web' : 'Web'
      ).slice(0, 100);
      const locationTimezone = (
        typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
          : 'UTC'
      ).slice(0, 100);
      const screenResolution = (
        typeof window !== 'undefined'
          ? `${window.innerWidth}x${window.innerHeight}`
          : '1920x1080'
      ).slice(0, 50);

      const loginId = `log_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const loginDocRef = doc(db, 'userLogins', loginId);

      await setDoc(loginDocRef, {
        uid: currentUser.uid,
        email: (currentUser.email || 'analyst@demandaura.ai').slice(0, 120),
        displayName: (
          currentUser.displayName ||
          currentUser.email?.split('@')[0] ||
          'Market Analyst'
        ).slice(0, 100),
        loginMethod: method,
        status,
        userAgent,
        platform,
        locationTimezone,
        screenResolution,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not record user login audit log:', err);
    }
  }

  // Ensure application-level UserProfile exists in /users/{uid}.
  // Does NOT store passwords or duplicate Firebase Auth email credentials in Firestore.
  async function ensureUserProfile(
    firebaseUser: User,
    overrides?: Partial<UserProfile>
  ) {
    const defaultProfile: UserProfile = {
      uid: firebaseUser.uid,
      displayName: sanitizeString(
        overrides?.displayName ||
          firebaseUser.displayName ||
          firebaseUser.email?.split('@')[0] ||
          'Market Analyst',
        BLUEPRINT_CONSTRAINTS.maxDisplayName,
        'Market Analyst'
      ),
      organization: sanitizeString(
        overrides?.organization || 'NexusDemand Intelligence',
        BLUEPRINT_CONSTRAINTS.maxOrganization,
        'NexusDemand Intelligence'
      ),
      jobTitle: sanitizeString(
        overrides?.jobTitle || 'Senior Demand Planner',
        BLUEPRINT_CONSTRAINTS.maxJobTitle,
        'Senior Demand Planner'
      ),
      preferredCountry: overrides?.preferredCountry || 'United_States',
      preferredCategory: overrides?.preferredCategory || 'Fashion_Beauty',
    };

    setUserEmail(firebaseUser.email || null);

    const isSuperAdmin =
      firebaseUser.email?.toLowerCase() === '21sri97v@gmail.com';
    if (!firebaseUser.emailVerified && !isSuperAdmin) {
      setProfile((prev) => prev || defaultProfile);
      return;
    }

    const userPath = `users/${firebaseUser.uid}`;
    const userRef = doc(db, 'users', firebaseUser.uid);

    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          ...defaultProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setProfile(defaultProfile);
      } else {
        const data = snap.data() as UserProfile;
        setProfile(data);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userPath);
    }
  }

  // Admin access detection and registry synchronization
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setAdminRole(null);
      return;
    }

    const isSuper = user.email?.toLowerCase() === '21sri97v@gmail.com';
    if (isSuper) {
      setIsAdmin(true);
      setAdminRole('super_admin');

      // Bootstrap admin record in /admins/{uid} if missing
      const adminDocRef = doc(db, 'admins', user.uid);
      getDoc(adminDocRef)
        .then((snap) => {
          if (!snap.exists()) {
            setDoc(adminDocRef, {
              uid: user.uid,
              email: user.email || '21sri97v@gmail.com',
              role: 'super_admin',
              assignedBy: 'system',
              isActive: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }).catch(() => {});
          }
        })
        .catch(() => {});
      return;
    }

    // Check if documented in /admins/{uid}
    const adminDocRef = doc(db, 'admins', user.uid);
    getDoc(adminDocRef)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.isActive !== false) {
            setIsAdmin(true);
            setAdminRole((data?.role as AdminRole) || 'admin');
            return;
          }
        }
        setIsAdmin(false);
        setAdminRole(null);
      })
      .catch(() => {
        setIsAdmin(false);
        setAdminRole(null);
      });
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await ensureUserProfile(currentUser);
        } catch (err) {
          console.error('Failed ensuring user profile:', err);
        }
      } else {
        setProfile(null);
        setUserEmail(null);
        setPredictions([]);
        setInquiries([]);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listeners for user profile, prediction history, and inquiries scoped by authenticated UID
  useEffect(() => {
    if (
      !isAuthReady ||
      !user ||
      (!user.emailVerified && user.email?.toLowerCase() !== '21sri97v@gmail.com')
    ) {
      return;
    }

    const activeUid = user.uid;
    const userDocPath = `users/${activeUid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', activeUid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, userDocPath)
    );

    const predictionsPath = `users/${activeUid}/predictions`;
    const predQuery = query(
      collection(db, 'users', activeUid, 'predictions'),
      where('uid', '==', activeUid)
    );
    const unsubPredictions = onSnapshot(
      predQuery,
      (snap) => {
        const items: PredictionRecord[] = snap.docs.map((d) => {
          const raw = d.data();
          const mType = (raw.modelType as ModelTypeKey) || 'divergence';
          return {
            id: d.id,
            uid: String(raw.uid || activeUid),
            modelType: mType,
            modelDisplayName: String(
              raw.modelDisplayName || MODEL_DISPLAY_NAME_MAP[mType] || mType
            ),
            countryName: String(raw.countryName || ''),
            category: String(raw.category || ''),
            summaryValue: String(raw.summaryValue || ''),
            numericResult: Number(raw.numericResult || 0),
            recordDate: String(raw.recordDate || ''),
            predictionStatus:
              raw.predictionStatus === 'error' ? 'error' : 'success',
            notes: String(raw.notes || ''),
            createdAtIso: formatTimestamp(raw.createdAt),
          };
        });
        items.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
        setPredictions(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, predictionsPath)
    );

    const inquiriesPath = 'contactInquiries';
    const inqQuery = query(
      collection(db, 'contactInquiries'),
      where('uid', '==', activeUid)
    );
    const unsubInquiries = onSnapshot(
      inqQuery,
      (snap) => {
        const list: ContactInquiry[] = snap.docs.map((d) => {
          const raw = d.data();
          return {
            id: d.id,
            uid: String(raw.uid || activeUid),
            senderName: String(raw.senderName || ''),
            organization: String(raw.organization || ''),
            topic: raw.topic as InquiryTopic,
            message: String(raw.message || ''),
            status: (raw.status as 'submitted' | 'resolved') || 'submitted',
            createdAtIso: formatTimestamp(raw.createdAt),
          };
        });
        list.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
        setInquiries(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, inquiriesPath)
    );

    return () => {
      unsubProfile();
      unsubPredictions();
      unsubInquiries();
    };
  }, [isAuthReady, user]);

  async function signUpWithEmail(input: EmailSignUpInput) {
    clearAuthError();
    setIsAuthActionPending(true);
    try {
      const cleanEmail = input.email.trim();
      const cleanName = sanitizeString(
        input.displayName,
        BLUEPRINT_CONSTRAINTS.maxDisplayName,
        'Market Analyst'
      );

      const credential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        input.password
      );

      await updateProfile(credential.user, {
        displayName: cleanName,
      });

      try {
        await sendEmailVerification(credential.user);
      } catch {
        // Verification email is best-effort
      }

      await ensureUserProfile(credential.user, {
        displayName: cleanName,
        organization: input.organization,
        jobTitle: input.jobTitle,
        preferredCountry: input.preferredCountry,
        preferredCategory: input.preferredCategory,
      });

      await recordUserLogin(credential.user, 'password', 'success');
    } catch (err: unknown) {
      const formatted = formatFirebaseAuthError(err);
      setAuthError(formatted.message);
      setIsEmailProviderDisabled(formatted.isProviderDisabled);
      throw err;
    } finally {
      setIsAuthActionPending(false);
    }
  }

  async function signInWithEmail(email: string, password: string) {
    clearAuthError();
    setIsAuthActionPending(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await recordUserLogin(cred.user, 'password', 'success');
    } catch (err: unknown) {
      const formatted = formatFirebaseAuthError(err);
      setAuthError(formatted.message);
      setIsEmailProviderDisabled(formatted.isProviderDisabled);
      throw err;
    } finally {
      setIsAuthActionPending(false);
    }
  }

  async function signInWithGoogle() {
    clearAuthError();
    setIsAuthActionPending(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await recordUserLogin(cred.user, 'google', 'success');
    } catch (err: unknown) {
      const formatted = formatFirebaseAuthError(err);
      setAuthError(formatted.message);
      throw err;
    } finally {
      setIsAuthActionPending(false);
    }
  }

  async function adminQuickSignIn(email = '21sri97v@gmail.com', password = '') {
    clearAuthError();
    setIsAuthActionPending(true);
    try {
      const targetEmail = email.trim() || '21sri97v@gmail.com';
      if (password) {
        let cred: any = null;
        try {
          cred = await signInWithEmailAndPassword(auth, targetEmail, password);
        } catch (signErr: any) {
          if (
            signErr?.code === 'auth/user-not-found' ||
            signErr?.code === 'auth/invalid-credential'
          ) {
            cred = await createUserWithEmailAndPassword(
              auth,
              targetEmail,
              password
            );
            await updateProfile(cred.user, {
              displayName: 'Lead Administrator',
            });
          } else {
            throw signErr;
          }
        }
        if (cred?.user) {
          await recordUserLogin(cred.user, 'admin_quick', 'success');
        }
      } else {
        const cred = await signInWithPopup(auth, googleProvider);
        if (cred?.user) {
          await recordUserLogin(cred.user, 'google', 'success');
        }
      }
    } catch (err: unknown) {
      const formatted = formatFirebaseAuthError(err);
      setAuthError(formatted.message);
      throw err;
    } finally {
      setIsAuthActionPending(false);
    }
  }

  async function logout() {
    clearAuthError();
    setIsAuthActionPending(true);
    try {
      await signOut(auth);
    } finally {
      setIsAuthActionPending(false);
    }
  }

  async function saveProfile(updates: {
    displayName: string;
    organization: string;
    jobTitle: string;
    preferredCountry: CanonicalCountry;
    preferredCategory: CanonicalCategory;
  }) {
    if (!user) throw new Error('You must be signed in to update your profile.');

    const updatedProfile: UserProfile = {
      uid: user.uid,
      displayName: sanitizeString(
        updates.displayName,
        BLUEPRINT_CONSTRAINTS.maxDisplayName,
        'Market Analyst'
      ),
      organization: sanitizeString(
        updates.organization,
        BLUEPRINT_CONSTRAINTS.maxOrganization,
        ''
      ),
      jobTitle: sanitizeString(
        updates.jobTitle,
        BLUEPRINT_CONSTRAINTS.maxJobTitle,
        ''
      ),
      preferredCountry: updates.preferredCountry,
      preferredCategory: updates.preferredCategory,
    };

    if (!user.emailVerified) {
      setProfile(updatedProfile);
      return;
    }

    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: updatedProfile.displayName,
        organization: updatedProfile.organization,
        jobTitle: updatedProfile.jobTitle,
        preferredCountry: updatedProfile.preferredCountry,
        preferredCategory: updatedProfile.preferredCategory,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  async function logPrediction(entry: {
    modelType: ModelTypeKey;
    modelDisplayName?: string;
    countryName: string;
    category: string;
    summaryValue: string;
    numericResult: number;
    recordDate: string;
    predictionStatus?: PredictionStatus;
    notes?: string;
  }) {
    const cleanNumeric = Number.isFinite(entry.numericResult)
      ? Number(entry.numericResult)
      : 0;

    const resolvedDisplayName = sanitizeString(
      entry.modelDisplayName || MODEL_DISPLAY_NAME_MAP[entry.modelType],
      BLUEPRINT_CONSTRAINTS.maxModelDisplayName,
      'NexusDemand ML Model'
    );

    const resolvedStatus: PredictionStatus =
      entry.predictionStatus === 'error' ? 'error' : 'success';

    if (!user || !user.emailVerified) {
      const localRecord: PredictionRecord = {
        id: `session_${Date.now()}`,
        uid: user?.uid || 'guest_session',
        modelType: entry.modelType,
        modelDisplayName: resolvedDisplayName,
        countryName: sanitizeString(entry.countryName, 64, 'United_States'),
        category: sanitizeString(entry.category, 64, 'Fashion_Beauty'),
        summaryValue: sanitizeString(
          entry.summaryValue,
          BLUEPRINT_CONSTRAINTS.maxSummaryValue,
          'N/A'
        ),
        numericResult: cleanNumeric,
        recordDate: sanitizeString(
          entry.recordDate,
          BLUEPRINT_CONSTRAINTS.maxRecordDate,
          'latest_available'
        ),
        predictionStatus: resolvedStatus,
        notes: sanitizeString(
          entry.notes || '',
          BLUEPRINT_CONSTRAINTS.maxNotes,
          ''
        ),
        createdAtIso: new Date().toISOString(),
      };
      setPredictions((prev) => [localRecord, ...prev]);
      return;
    }

    const activeUid = user.uid;
    const predId = `pred_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const path = `users/${activeUid}/predictions/${predId}`;

    try {
      await setDoc(doc(db, 'users', activeUid, 'predictions', predId), {
        uid: activeUid,
        modelType: entry.modelType,
        modelDisplayName: resolvedDisplayName,
        countryName: sanitizeString(entry.countryName, 64, 'United_States'),
        category: sanitizeString(entry.category, 64, 'Fashion_Beauty'),
        summaryValue: sanitizeString(
          entry.summaryValue,
          BLUEPRINT_CONSTRAINTS.maxSummaryValue,
          'N/A'
        ),
        numericResult: cleanNumeric,
        recordDate: sanitizeString(
          entry.recordDate,
          BLUEPRINT_CONSTRAINTS.maxRecordDate,
          'latest_available'
        ),
        predictionStatus: resolvedStatus,
        notes: sanitizeString(
          entry.notes || '',
          BLUEPRINT_CONSTRAINTS.maxNotes,
          ''
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  async function updatePredictionNote(predictionId: string, notes: string) {
    const cleanNotes = sanitizeString(
      notes,
      BLUEPRINT_CONSTRAINTS.maxNotes,
      ''
    );

    if (!user || !user.emailVerified || predictionId.startsWith('session_')) {
      setPredictions((prev) =>
        prev.map((p) =>
          p.id === predictionId ? { ...p, notes: cleanNotes } : p
        )
      );
      return;
    }

    const activeUid = user.uid;
    const path = `users/${activeUid}/predictions/${predictionId}`;
    try {
      await updateDoc(
        doc(db, 'users', activeUid, 'predictions', predictionId),
        {
          notes: cleanNotes,
          updatedAt: serverTimestamp(),
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  async function deletePrediction(predictionId: string) {
    if (!user || !user.emailVerified || predictionId.startsWith('session_')) {
      setPredictions((prev) => prev.filter((p) => p.id !== predictionId));
      return;
    }

    const activeUid = user.uid;
    const path = `users/${activeUid}/predictions/${predictionId}`;
    try {
      await deleteDoc(doc(db, 'users', activeUid, 'predictions', predictionId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  async function submitContactInquiry(inquiry: {
    senderName: string;
    organization: string;
    topic: InquiryTopic;
    message: string;
  }) {
    if (!user) {
      throw new Error('Please sign in to submit an authenticated inquiry.');
    }

    const activeUid = user.uid;
    const inquiryId = `inq_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    if (!user.emailVerified) {
      const localInquiry: ContactInquiry = {
        id: inquiryId,
        uid: activeUid,
        senderName: sanitizeString(
          inquiry.senderName,
          BLUEPRINT_CONSTRAINTS.maxDisplayName,
          'Analyst'
        ),
        organization: sanitizeString(
          inquiry.organization,
          BLUEPRINT_CONSTRAINTS.maxOrganization,
          'Organization'
        ),
        topic: inquiry.topic,
        message: sanitizeString(
          inquiry.message,
          BLUEPRINT_CONSTRAINTS.maxMessage,
          'Inquiry details'
        ),
        status: 'submitted',
        createdAtIso: new Date().toISOString(),
      };
      setInquiries((prev) => [localInquiry, ...prev]);
      return;
    }

    const path = `contactInquiries/${inquiryId}`;

    try {
      await setDoc(doc(db, 'contactInquiries', inquiryId), {
        uid: activeUid,
        senderName: sanitizeString(
          inquiry.senderName,
          BLUEPRINT_CONSTRAINTS.maxDisplayName,
          'Analyst'
        ),
        organization: sanitizeString(
          inquiry.organization,
          BLUEPRINT_CONSTRAINTS.maxOrganization,
          'Organization'
        ),
        topic: inquiry.topic,
        message: sanitizeString(
          inquiry.message,
          BLUEPRINT_CONSTRAINTS.maxMessage,
          'Inquiry details'
        ),
        status: 'submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        uid: user?.uid ?? null,
        profile,
        userEmail,
        isAdmin,
        adminRole,
        isAuthReady,
        isAuthActionPending,
        authError,
        isEmailProviderDisabled,
        clearAuthError,
        predictions,
        inquiries,
        recordUserLogin,
        adminQuickSignIn,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        logout,
        saveProfile,
        logPrediction,
        updatePredictionNote,
        deletePrediction,
        submitContactInquiry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
