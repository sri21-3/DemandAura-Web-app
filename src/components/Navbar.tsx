import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppPage } from '../types/models';
import { DemandAuraLogo } from './DemandAuraLogo';

interface NavbarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, profile, logout, isAuthReady, isAuthActionPending } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: AppPage; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'divergence', label: 'Divergence' },
    { id: 'forecast', label: 'Forecast' },
    { id: 'segmentation', label: 'Segmentation' },
    { id: 'history', label: 'History' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  const primaryNav = navItems.slice(0, 6);
  const secondaryNav = navItems.slice(6);

  const handleNav = (page: AppPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Logo & Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight text-slate-900 hover:text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
        >
          <DemandAuraLogo size={34} />
          <span>DemandAura</span>
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {primaryNav.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                  active
                    ? 'text-slate-900 border-slate-900 font-semibold'
                    : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          {secondaryNav.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`hidden xl:inline-block py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                  active
                    ? 'text-slate-900 border-slate-900 font-semibold'
                    : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {!isAuthReady ? (
            <span className="text-xs text-slate-400 font-mono-tabular">
              Checking Session...
            </span>
          ) : user ? (
            <>
              <button
                type="button"
                onClick={() => handleNav('profile')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                  currentPage === 'profile'
                    ? 'bg-slate-100 border-slate-300 text-slate-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {profile?.displayName || user.displayName || 'Profile'}
              </button>
              <button
                type="button"
                disabled={isAuthActionPending}
                onClick={async () => {
                  await logout();
                  handleNav('home');
                }}
                className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                {isAuthActionPending ? 'Signing Out...' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNav('signin')}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleNav('signup')}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`text-left px-3 py-2 text-sm font-medium rounded-lg ${
                  currentPage === item.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('profile')}
                  className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('signin')}
                  className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('signup')}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
