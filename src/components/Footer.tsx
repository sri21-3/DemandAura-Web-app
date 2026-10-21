import React from 'react';
import { AppPage } from '../types/models';
import { DemandAuraLogo } from './DemandAuraLogo';

interface FooterProps {
  onNavigate: (page: AppPage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#070E24] text-slate-300 border-t border-slate-800/80 mt-20">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800/80">
          <div className="lg:col-span-1 space-y-3">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              <DemandAuraLogo size={32} />
              <span className="bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
                DemandAura
              </span>
            </button>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sense the Future of Global Consumer Demand. Uncover genuine market
              interest, filter out passing hype, and forecast 4-week demand
              trends across 14 countries in Fashion &amp; Beauty, Fitness &amp;
              Wearables, and Nutrition &amp; Diets.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-white">
              Market Foresight Tools
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('divergence')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Demand vs. Hype Divergence Score
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('forecast')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  4-Week Search Interest Forecast
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('segmentation')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Long-Term Market Segmentation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('segmentation')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  4-Week Recent Momentum Segmentation
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-white">
              Platform Navigation
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Intelligence Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('history')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Saved Market Analyses
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  How It Works &amp; Keyword Coverage
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Contact &amp; Developer Info
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-white">
              Legal &amp; Compliance
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Terms of Service</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Google User Data Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Data Deletion Instructions
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-white">
              Platform &amp; Support
            </div>
            <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
              <div className="font-semibold text-white">
                DemandAura Operations
              </div>
              <div>
                <a
                  href="mailto:support@demandaura.com"
                  className="text-cyan-300 hover:underline"
                >
                  support@demandaura.com
                </a>
              </div>
              <div className="text-slate-400 pt-0.5">
                Predictive Demand Intelligence Engine
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} DemandAura. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>14 Global Markets</span>
            <span aria-hidden="true">·</span>
            <span>3 Consumer Categories</span>
            <span aria-hidden="true">·</span>
            <span>63 Tracked Consumer Search Keywords</span>
          </div>
        </div>

        {/* Fair Use & Trademark Disclaimer */}
        <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 leading-relaxed">
          <p>
            <strong>Research Fair Use &amp; Trademark Notice:</strong> DemandAura is an independent machine learning demand intelligence platform. Search interest metrics are derived from normalized public Google Trends™ signals alongside macroeconomic and media datasets. Google, Google Trends, Firebase, and related marks are registered trademarks of Google LLC. DemandAura is not affiliated with, sponsored by, or endorsed by Google LLC or Alphabet Inc.
          </p>
        </div>
      </div>
    </footer>
  );
};
