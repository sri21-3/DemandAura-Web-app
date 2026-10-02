import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppPage } from '../types/models';
import { DemandAuraLogo } from './DemandAuraLogo';

interface NavbarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

const WORKSPACE_PAGES = new Set<AppPage>([
  'dashboard',
  'divergence',
  'forecast',
  'segmentation',
  'history',
]);

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, profile, logout, isAuthReady, isAuthActionPending } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ordered strictly as requested: Home, About, Contact, Dashboard
  const navItems: { id: AppPage; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
    { id: 'dashboard', label: 'Dashboard' },
  ];

  const isNavItemActive = (itemId: AppPage) => {
    if (itemId === 'dashboard') {
      return WORKSPACE_PAGES.has(currentPage);
    }
    return currentPage === itemId;
  };

  const handleNav = (page: AppPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070E24]/95 backdrop-blur-md border-b border-slate-800/80 text-white">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Logo & Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="inline-flex items-center gap-3 text-xl font-semibold tracking-tight text-white hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
        >
          <DemandAuraLogo size={36} />
          <span className="bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
            DemandAura
          </span>
        </button>

        {/* Zone 2: Clean text navigation links (Home, About, Contact, Dashboard) */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
          {navItems.map((item) => {
            const active = isNavItemActive(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`relative py-2 transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Account Actions */}
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
                    ? 'bg-slate-800 border-cyan-500/50 text-white'
                    : 'border-slate-700 text-slate-200 hover:bg-slate-800/80'
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
                className="px-3.5 py-2 text-xs font-medium text-white btn-aura-primary rounded-lg disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {isAuthActionPending ? 'Signing Out...' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNav('signin')}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleNav('signup')}
                className="px-4 py-2 text-xs font-medium text-white btn-aura-primary rounded-lg whitespace-nowrap cursor-pointer"
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
          className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#09122B] border-b border-slate-800 px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const active = isNavItemActive(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`text-left px-3 py-2 text-sm font-medium rounded-lg ${
                    active
                      ? 'btn-aura-primary text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('profile')}
                  className="px-4 py-2 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-white btn-aura-primary rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('signin')}
                  className="px-4 py-2 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('signup')}
                  className="px-4 py-2 text-xs font-medium text-white btn-aura-primary rounded-lg"
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
