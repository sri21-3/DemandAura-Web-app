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
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'divergence',
    label: 'Divergence',
    subtitle: 'Demand vs. Hype (-1 to +1)',
    icon: Activity,
  },
  {
    id: 'forecast',
    label: 'Forecast',
    subtitle: '4-Week Search Outlook',
    icon: TrendingUp,
  },
  {
    id: 'segmentation',
    label: 'Segmentation',
    subtitle: '3+ Years & 4-Week Segments',
    icon: Layers,
  },
  {
    id: 'history',
    label: 'History',
    subtitle: 'Saved Market Analyses',
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
        className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] select-none"
      >
        <div className="p-5 border-b border-slate-100">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
              currentPage === 'dashboard'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <div>
              <div>Dashboard Overview</div>
              <div
                className={`text-[11px] font-normal ${
                  currentPage === 'dashboard'
                    ? 'text-slate-300'
                    : 'text-slate-500'
                }`}
              >
                Command Center &amp; Visuals
              </div>
            </div>
          </button>
        </div>

        <div className="p-4 space-y-1.5 flex-1">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace Tools
          </div>
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-white' : 'text-slate-500'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight">
                    {item.label}
                  </div>
                  <div
                    className={`text-[11px] truncate mt-0.5 ${
                      active ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {item.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 m-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
          <div className="font-semibold text-slate-900">
            42 Global Markets Active
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            14 Countries × 3 Categories updated weekly with live reports.
          </p>
        </div>
      </aside>

      {/* Mobile / Tablet Compact Workspace Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2.5 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              currentPage === 'dashboard'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Overview
          </button>
          {SIDEBAR_ITEMS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
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
