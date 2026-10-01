import React from 'react';
import { DEVELOPER_INFO } from '../config/api';
import { AppPage } from '../types/models';
import { DemandAuraLogo } from './DemandAuraLogo';

interface FooterProps {
  onNavigate: (page: AppPage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100">
          <div className="md:col-span-1 space-y-3">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight text-slate-900 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <DemandAuraLogo size={32} />
              <span>DemandAura</span>
            </button>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sense the Future of Global Consumer Demand. Uncover genuine market
              interest, filter out passing hype, and forecast 4-week demand
              trends across 14 countries in Fashion &amp; Beauty, Fitness &amp;
              Wearables, and Nutrition &amp; Diets.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-900">
              Market Foresight Tools
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('divergence')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Demand vs. Hype Divergence Score
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('forecast')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  4-Week Search Interest Forecast
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('segmentation')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Long-Term Market Segmentation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('segmentation')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  4-Week Recent Momentum Segmentation
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-900">
              Platform Navigation
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Intelligence Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('history')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Saved Market Analyses
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  How It Works &amp; Keyword Coverage
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Contact &amp; Developer Info
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-900">
              Developer &amp; Creator
            </div>
            <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <div className="font-semibold text-slate-900">
                {DEVELOPER_INFO.name}
              </div>
              <div>
                <a
                  href={`mailto:${DEVELOPER_INFO.email}`}
                  className="text-slate-600 hover:text-slate-900 underline"
                >
                  {DEVELOPER_INFO.email}
                </a>
              </div>
              <div className="flex items-center gap-3 pt-0.5">
                <a
                  href={DEVELOPER_INFO.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-700 hover:text-slate-900 underline font-medium"
                >
                  GitHub
                </a>
                <span aria-hidden="true">·</span>
                <a
                  href={DEVELOPER_INFO.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-700 hover:text-slate-900 underline font-medium"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} DemandAura · Designed &amp; Developed
            by <strong className="text-slate-800">{DEVELOPER_INFO.name}</strong>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>14 Global Markets</span>
            <span aria-hidden="true">·</span>
            <span>3 Consumer Categories</span>
            <span aria-hidden="true">·</span>
            <span>63 Tracked Consumer Search Keywords</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
