import React from 'react';
import {
  Activity,
  Clock,
  Layers,
  LayoutDashboard,
  TrendingUp,
} from 'lucide-react';
import { AppPage } from '../types/models';

interface DashboardSidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

const SIDEBAR_ITEMS: {
  id: AppPage;
  label: string;
  subtitle: string;
  accentColor: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'divergence',
    label: 'Divergence',
    subtitle: 'Demand vs. Hype (-1 to +1)',
    accentColor: 'text-emerald-400',
    icon: Activity,
  },
  {
    id: 'forecast',
    label: 'Forecast',
    subtitle: '4-Week Search Outlook',
    accentColor: 'text-cyan-400',
    icon: TrendingUp,
  },
  {
    id: 'segmentation',
    label: 'Segmentation',
    subtitle: '3+ Years & 4-Week Segments',
    accentColor: 'text-indigo-400',
    icon: Layers,
  },
  {
    id: 'history',
    label: 'History',
    subtitle: 'Saved Market Analyses',
    accentColor: 'text-violet-400',
    icon: Clock,
  },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  currentPage,
  onNavigate,
}) => {
  return (
    <>
      {/* Desktop Left Side Navigation Bar */}
      <aside
        aria-label="Dashboard Workspace Navigation"
        className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 bg-aura-sidebar text-slate-200 border-r border-slate-800/80 min-h-[calc(100vh-4rem)] select-none"
      >
        <div className="p-5 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              currentPage === 'dashboard'
                ? 'bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-indigo-500/20 border border-cyan-400/40 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                currentPage === 'dashboard'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <div className="text-sm font-semibold">Dashboard</div>
              <div
                className={`text-[11px] font-normal ${
                  currentPage === 'dashboard'
                    ? 'text-cyan-200/90'
                    : 'text-slate-400'
                }`}
              >
                Command Center &amp; Visuals
              </div>
            </div>
          </button>
        </div>

        <div className="p-4 space-y-2 flex-1">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Foresight Models
          </div>
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer border ${
                  active
                    ? 'bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-indigo-500/20 border-cyan-400/40 text-white shadow-sm'
                    : 'border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800/90'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-cyan-300' : item.accentColor
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight">
                    {item.label}
                  </div>
                  <div
                    className={`text-[11px] truncate mt-0.5 ${
                      active ? 'text-cyan-200/90' : 'text-slate-400'
                    }`}
                  >
                    {item.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 m-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-semibold text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>42 Global Markets Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            14 Countries × 3 Categories updated weekly with live segment
            reports.
          </p>
        </div>
      </aside>

      {/* Mobile / Tablet Compact Workspace Bar */}
      <div className="lg:hidden bg-[#0A142E] border-b border-slate-800 px-4 py-2.5 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentPage === 'dashboard'
                ? 'btn-aura-primary text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Dashboard
          </button>
          {SIDEBAR_ITEMS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
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
      </div>
    </>
  );
};
