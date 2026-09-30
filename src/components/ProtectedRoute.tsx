import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthView } from '../pages/AuthPages';
import { AppPage } from '../types/models';

interface ProtectedRouteProps {
  children: React.ReactNode;
  pageName: string;
  targetPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  pageName,
  targetPage,
  onNavigate,
}) => {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="max-w-md mx-auto px-6 py-24 text-center space-y-4"
      >
        <div className="h-8 w-8 mx-auto rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
        <div className="text-sm font-semibold text-slate-900">
          Restoring Authentication Session...
        </div>
        <p className="text-xs text-slate-500">
          Verifying persistent Firebase credentials and loading your analyst
          workspace.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-2">
        <div className="max-w-lg mx-auto px-6 pt-10">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
            <div className="font-semibold">
              Protected Workspace Route: {pageName}
            </div>
            <p className="text-amber-800">
              Please sign in with your Email &amp; Password or Google account to
              access {pageName} and synchronize your UID-scoped records in
              Firestore.
            </p>
          </div>
        </div>
        <AuthView
          mode="signin"
          onNavigate={onNavigate}
          redirectAfterAuth={targetPage}
        />
      </div>
    );
  }

  return <>{children}</>;
};
