import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
} from 'firebase/firestore';
import firebaseAppletConfig from '../firebase-applet-config.json';
import blueprint from '../firebase-blueprint.json';

/**
 * Resolves public Firebase Web SDK configuration from environment variables
 * with fallback to AI Studio's provisioned firebase-applet-config.json.
 * Never includes private service-account secrets on the client.
 */
const resolvedFirebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    firebaseAppletConfig.authDomain,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    firebaseAppletConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    firebaseAppletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    firebaseAppletConfig.firestoreDatabaseId,
};

export const FIREBASE_PROJECT_ID = resolvedFirebaseConfig.projectId;

const app = initializeApp(resolvedFirebaseConfig);
export const db = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Configure explicit browserLocalPersistence so authentication state persists across browser reloads
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Could not set browserLocalPersistence on Firebase Auth:', err);
});

export function formatFirebaseAuthError(err: unknown): {
  message: string;
  isProviderDisabled: boolean;
  code?: string;
} {
  const code =
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code?: unknown }).code === 'string'
      ? (err as { code: string }).code
      : undefined;

  switch (code) {
    case 'auth/operation-not-allowed':
      return {
        code,
        isProviderDisabled: true,
        message:
          'Email/Password Sign-In is not yet enabled in your Firebase Console. Enable it under Authentication → Sign-in method → Email/Password, or use Google Sign-In below.',
      };
    case 'auth/email-already-in-use':
      return {
        code,
        isProviderDisabled: false,
        message:
          'An account with this email address already exists. Please sign in instead.',
      };
    case 'auth/invalid-email':
      return {
        code,
        isProviderDisabled: false,
        message: 'Please enter a valid email address.',
      };
    case 'auth/weak-password':
      return {
        code,
        isProviderDisabled: false,
        message: 'Password is too weak. Please use at least 6 characters.',
      };
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return {
        code,
        isProviderDisabled: false,
        message:
          'Invalid email or password. Please check your credentials and try again.',
      };
    case 'auth/too-many-requests':
      return {
        code,
        isProviderDisabled: false,
        message:
          'Too many unsuccessful authentication attempts. Please wait a moment and try again.',
      };
    case 'auth/popup-closed-by-user':
      return {
        code,
        isProviderDisabled: false,
        message:
          'The Google Sign-In popup was closed before completing authentication.',
      };
    default:
      return {
        code,
        isProviderDisabled: false,
        message:
          err instanceof Error
            ? err.message
            : 'Authentication failed. Please try again.',
      };
  }
}

// Synchronize validation bounds directly from firebase-blueprint.json
export const BLUEPRINT_CONSTRAINTS = {
  idPattern: new RegExp(
    blueprint.entities.UserProfile.properties.uid.pattern || '^[a-zA-Z0-9_\\-]+$'
  ),
  maxIdLength: blueprint.entities.UserProfile.properties.uid.maxLength || 128,
  maxDisplayName:
    blueprint.entities.UserProfile.properties.displayName.maxLength || 100,
  maxOrganization:
    blueprint.entities.UserProfile.properties.organization.maxLength || 120,
  maxJobTitle:
    blueprint.entities.UserProfile.properties.jobTitle.maxLength || 100,
  maxModelDisplayName:
    blueprint.entities.PredictionRecord.properties.modelDisplayName.maxLength ||
    120,
  maxSummaryValue:
    blueprint.entities.PredictionRecord.properties.summaryValue.maxLength || 200,
  maxRecordDate:
    blueprint.entities.PredictionRecord.properties.recordDate.maxLength || 100,
  maxNotes:
    blueprint.entities.PredictionRecord.properties.notes.maxLength || 500,
  maxMessage:
    blueprint.entities.ContactInquiry.properties.message.maxLength || 2000,
  minMessage:
    blueprint.entities.ContactInquiry.properties.message.minLength || 5,
};

export function sanitizeString(
  val: string,
  maxLength: number,
  fallback = ''
): string {
  const trimmed = (val || '').trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();
