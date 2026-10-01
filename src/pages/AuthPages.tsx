import React, { useEffect, useState } from 'react';
import { DemandAuraLogo } from '../components/DemandAuraLogo';
import {
  formatEntityLabel,
  VALID_CATEGORIES,
  VALID_COUNTRIES,
} from '../config/api';
import { useAuth } from '../context/AuthContext';
import { FIREBASE_PROJECT_ID } from '../firebase';
import {
  AppPage,
  CanonicalCategory,
  CanonicalCountry,
} from '../types/models';

interface AuthViewProps {
  mode: 'signin' | 'signup';
  onNavigate: (page: AppPage) => void;
  redirectAfterAuth?: AppPage;
}

export const AuthView: React.FC<AuthViewProps> = ({
  mode: initialMode,
  onNavigate,
  redirectAfterAuth = 'dashboard',
}) => {
  const {
    user,
    isAuthReady,
    isAuthActionPending,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    authError,
    isEmailProviderDisabled,
    clearAuthError,
  } = useAuth();

  const [activeMode, setActiveMode] = useState<'signin' | 'signup'>(
    initialMode
  );

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [organization, setOrganization] = useState('DemandAura Intelligence');
  const [jobTitle, setJobTitle] = useState('Senior Demand Planner');
  const [preferredCountry, setPreferredCountry] =
    useState<CanonicalCountry>('United_States');
  const [preferredCategory, setPreferredCategory] =
    useState<CanonicalCategory>('Fashion_Beauty');

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setActiveMode(initialMode);
    setValidationError(null);
    clearAuthError();
  }, [initialMode]);

  useEffect(() => {
    if (isAuthReady && user) {
      onNavigate(redirectAfterAuth);
    }
  }, [isAuthReady, user, onNavigate, redirectAfterAuth]);

  if (!isAuthReady) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="max-w-md mx-auto px-6 py-24 text-center space-y-4"
      >
        <div className="h-8 w-8 mx-auto rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
        <div className="text-sm font-semibold text-slate-900">
          Checking Authentication State...
        </div>
        <p className="text-xs text-slate-500">
          Verifying persistent session in browser storage.
        </p>
      </div>
    );
  }

  const handleModeSwitch = (nextMode: 'signin' | 'signup') => {
    setActiveMode(nextMode);
    setValidationError(null);
    clearAuthError();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthActionPending) return;

    setValidationError(null);
    clearAuthError();

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (activeMode === 'signup') {
      if (!displayName.trim()) {
        setValidationError('Display Name is required to create an account.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match.');
        return;
      }

      try {
        await signUpWithEmail({
          email: cleanEmail,
          password,
          displayName: displayName.trim(),
          organization: organization.trim(),
          jobTitle: jobTitle.trim(),
          preferredCountry,
          preferredCategory,
        });
        onNavigate(redirectAfterAuth);
      } catch {
        // Error handled by AuthContext authError
      }
    } else {
      try {
        await signInWithEmail(cleanEmail, password);
        onNavigate(redirectAfterAuth);
      } catch {
        // Error handled by AuthContext authError
      }
    }
  };

  const handleGoogleAuth = async () => {
    if (isAuthActionPending) return;
    setValidationError(null);
    clearAuthError();
    try {
      await signInWithGoogle();
      onNavigate(redirectAfterAuth);
    } catch {
      // Error displayed via authError
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center pb-1">
            <DemandAuraLogo size={48} />
          </div>
          <div className="text-xs text-slate-500">
            DemandAura Identity &amp; Workspace Access
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            {activeMode === 'signin'
              ? 'Sign In to DemandAura'
              : 'Create Your DemandAura Account'}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sign in with Email &amp; Password or Google to save your market
            analyses, forecasts, and default market preferences across devices.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            disabled={isAuthActionPending}
            onClick={() => handleModeSwitch('signin')}
            className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeMode === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            disabled={isAuthActionPending}
            onClick={() => handleModeSwitch('signup')}
            className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeMode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {(validationError || authError) && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-900 text-xs rounded-lg p-3.5 space-y-2"
          >
            <div className="font-semibold">Authentication Notice</div>
            <div>{validationError || authError}</div>
            {isEmailProviderDisabled && (
              <div className="pt-2 border-t border-red-200 text-[11px] text-red-800 space-y-1">
                <div className="font-semibold">
                  How to enable Email/Password in Firebase Console:
                </div>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>
                    Open{' '}
                    <a
                      href={`https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Firebase Console → Authentication → Sign-in method
                    </a>
                  </li>
                  <li>
                    Click <strong>Email/Password</strong>, toggle{' '}
                    <strong>Enable</strong>, and click <strong>Save</strong>.
                  </li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Email + Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
          {activeMode === 'signup' && (
            <>
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Display Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  disabled={isAuthActionPending}
                  maxLength={100}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Priya Sharma"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-org"
                    className="block text-xs font-semibold text-slate-800"
                  >
                    Organization
                  </label>
                  <input
                    id="auth-org"
                    type="text"
                    disabled={isAuthActionPending}
                    maxLength={120}
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-role"
                    className="block text-xs font-semibold text-slate-800"
                  >
                    Job Title
                  </label>
                  <input
                    id="auth-role"
                    type="text"
                    disabled={isAuthActionPending}
                    maxLength={100}
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-country"
                    className="block text-xs font-semibold text-slate-800"
                  >
                    Default Target Country
                  </label>
                  <select
                    id="auth-country"
                    disabled={isAuthActionPending}
                    value={preferredCountry}
                    onChange={(e) =>
                      setPreferredCountry(e.target.value as CanonicalCountry)
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    {VALID_COUNTRIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-category"
                    className="block text-xs font-semibold text-slate-800"
                  >
                    Default Category
                  </label>
                  <select
                    id="auth-category"
                    disabled={isAuthActionPending}
                    value={preferredCategory}
                    onChange={(e) =>
                      setPreferredCategory(e.target.value as CanonicalCategory)
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    {VALID_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-slate-800"
            >
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              disabled={isAuthActionPending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@organization.com"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold text-slate-800"
            >
              Password <span className="text-red-600">*</span>
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={
                activeMode === 'signin' ? 'current-password' : 'new-password'
              }
              required
              disabled={isAuthActionPending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
            />
          </div>

          {activeMode === 'signup' && (
            <div className="space-y-1.5">
              <label
                htmlFor="auth-confirm-password"
                className="block text-xs font-semibold text-slate-800"
              >
                Confirm Password <span className="text-red-600">*</span>
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                disabled={isAuthActionPending}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthActionPending}
            aria-busy={isAuthActionPending}
            className="w-full py-2.5 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isAuthActionPending
              ? activeMode === 'signin'
                ? 'Signing In...'
                : 'Creating Account...'
              : activeMode === 'signin'
              ? 'Sign In with Email & Password'
              : 'Create Account with Email & Password'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200" />
          <span className="flex-shrink mx-3 text-xs text-slate-400">
            or authenticate with OAuth
          </span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isAuthActionPending}
          className="w-full py-2.5 px-4 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isAuthActionPending
            ? 'Connecting to Google...'
            : activeMode === 'signin'
            ? 'Continue with Google'
            : 'Sign Up with Google'}
        </button>

        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
          {activeMode === 'signin' ? (
            <>
              New to NexusDemand?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('signup')}
                className="font-semibold text-slate-900 underline cursor-pointer"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('signin')}
                className="font-semibold text-slate-900 underline cursor-pointer"
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProfilePageProps {
  onNavigate: (page: AppPage) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const {
    user,
    uid,
    profile,
    userEmail,
    predictions,
    saveProfile,
    logout,
    isAuthActionPending,
  } = useAuth();

  const [displayName, setDisplayName] = useState(
    profile?.displayName || user?.displayName || ''
  );
  const [organization, setOrganization] = useState(
    profile?.organization || 'DemandAura Intelligence'
  );
  const [jobTitle, setJobTitle] = useState(
    profile?.jobTitle || 'Senior Demand Planner'
  );
  const [preferredCountry, setPreferredCountry] = useState<CanonicalCountry>(
    profile?.preferredCountry || 'United_States'
  );
  const [preferredCategory, setPreferredCategory] = useState<CanonicalCategory>(
    profile?.preferredCategory || 'Fashion_Beauty'
  );
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setOrganization(profile.organization);
      setJobTitle(profile.jobTitle);
      setPreferredCountry(profile.preferredCountry);
      setPreferredCategory(profile.preferredCategory);
    }
  }, [profile]);

  if (!user) {
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(null);
    setSaveError(null);
    try {
      await saveProfile({
        displayName,
        organization,
        jobTitle,
        preferredCountry,
        preferredCategory,
      });
      setSavedNotice('Profile settings updated.');
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  const authProviderLabel =
    user.providerData[0]?.providerId === 'google.com'
      ? 'Google OAuth 2.0'
      : 'Email & Password';

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="text-xs text-slate-500">
            Account &amp; Default Model Preferences
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Analyst Profile
          </h1>
        </div>
        <button
          type="button"
          disabled={isAuthActionPending}
          onClick={async () => {
            await logout();
            onNavigate('home');
          }}
          className="px-4 py-2 text-xs font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer self-start"
        >
          {isAuthActionPending ? 'Signing Out...' : 'Sign Out of Workspace'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Authenticated Identity</div>
            <div className="text-base font-semibold text-slate-900">
              {displayName || 'Analyst'}
            </div>
            <div className="text-xs text-slate-500 font-mono-tabular break-all">
              {userEmail || user.email}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div>
              Authenticated UID:{' '}
              <span className="font-mono-tabular text-slate-800 break-all">
                {uid}
              </span>
            </div>
            <div>
              Auth Provider:{' '}
              <span className="font-medium text-slate-900">
                {authProviderLabel}
              </span>
            </div>
            <div>
              Persistence:{' '}
              <span className="font-mono-tabular text-emerald-700">
                browserLocalPersistence
              </span>
            </div>
            <div>
              Saved Predictions:{' '}
              <span className="font-mono-tabular font-semibold text-slate-900">
                {predictions.length}
              </span>
            </div>
            <div>
              Default Market:{' '}
              <span className="font-medium text-slate-900">
                {formatEntityLabel(preferredCountry)} ·{' '}
                {formatEntityLabel(preferredCategory)}
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-slate-900">
            Update Profile &amp; Model Defaults
          </h2>

          {savedNotice && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3">
              {savedNotice}
            </div>
          )}

          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3">
              {saveError}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="prof-name"
                className="block text-xs font-semibold text-slate-800"
              >
                Display Name *
              </label>
              <input
                id="prof-name"
                type="text"
                required
                maxLength={100}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="prof-org"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Organization
                </label>
                <input
                  id="prof-org"
                  type="text"
                  maxLength={120}
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="prof-role"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Job Title / Role
                </label>
                <input
                  id="prof-role"
                  type="text"
                  maxLength={100}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="prof-country"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Default Target Country
                </label>
                <select
                  id="prof-country"
                  value={preferredCountry}
                  onChange={(e) =>
                    setPreferredCountry(e.target.value as CanonicalCountry)
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  {VALID_COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="prof-category"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Default Consumer Category
                </label>
                <select
                  id="prof-category"
                  value={preferredCategory}
                  onChange={(e) =>
                    setPreferredCategory(e.target.value as CanonicalCategory)
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  {VALID_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving Preferences...' : 'Save Profile Preferences'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
