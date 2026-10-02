import React from 'react';
import {
  Activity,
  ArrowRight,
  Globe,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import categoryFashionBeauty from '../assets/images/category_fashion_beauty_1790750702602.jpg';
import categoryFitnessWearables from '../assets/images/category_fitness_wearables_1790750714853.jpg';
import categoryNutritionDiets from '../assets/images/category_nutrition_diets_1790750728244.jpg';
import heroImage from '../assets/images/hero_market_foresight_1790705585148.jpg';
import { DemandAuraLogo } from '../components/DemandAuraLogo';
import { VALID_CATEGORIES, VALID_COUNTRIES } from '../config/api';
import { AppPage, CanonicalCategory, HealthResponse } from '../types/models';

interface HomePageProps {
  onNavigate: (page: AppPage) => void;
  health?: HealthResponse | null;
  healthLoading?: boolean;
}

const CATEGORY_IMAGES: Record<CanonicalCategory, string> = {
  Fashion_Beauty: categoryFashionBeauty,
  Fitness_Wearables: categoryFitnessWearables,
  Nutrition_Diets: categoryNutritionDiets,
};

const CATEGORY_ACCENTS: Record<
  CanonicalCategory,
  {
    topBar: string;
    badgeBg: string;
    themeCardBg: string;
  }
> = {
  Fashion_Beauty: {
    topBar: 'from-pink-500 via-purple-500 to-indigo-500',
    badgeBg: 'text-purple-700 bg-purple-50 border-purple-200',
    themeCardBg: 'bg-purple-50/40 border-purple-100/80',
  },
  Fitness_Wearables: {
    topBar: 'from-teal-400 via-cyan-500 to-blue-600',
    badgeBg: 'text-cyan-800 bg-cyan-50 border-cyan-200',
    themeCardBg: 'bg-cyan-50/40 border-cyan-100/80',
  },
  Nutrition_Diets: {
    topBar: 'from-emerald-400 via-teal-500 to-cyan-600',
    badgeBg: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    themeCardBg: 'bg-emerald-50/40 border-emerald-100/80',
  },
};

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-20 pb-8">
      {/* Hero Section */}
      <section className="bg-aura-hero text-white border-b border-slate-800/80 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex flex-wrap items-center gap-2 text-xs text-cyan-300/90 font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Demand Intelligence &amp; Market Foresight Platform</span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="text-slate-300">14 Global Countries</span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="text-slate-300">
                3 Consumer Lifestyle Categories
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <DemandAuraLogo
                  size={60}
                  className="rounded-full shadow-[0_0_28px_rgba(34,211,238,0.35)]"
                />
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.06]">
                  DemandAura
                </h1>
              </div>
              <p
                className="text-xl sm:text-3xl font-semibold text-aura-light-gradient tracking-tight pt-1"
                style={{ textWrap: 'balance' }}
              >
                Sense the Future of Global Consumer Demand.
              </p>
            </div>

            <p className="text-base text-slate-300 leading-relaxed max-w-2xl">
              Uncover genuine market interest, filter out passing hype, and
              forecast 4-week demand trends across 14 countries in Fashion
              &amp; Beauty, Fitness &amp; Wearables, and Nutrition &amp; Diets.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 text-sm font-semibold btn-aura-primary rounded-xl inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Open Intelligence Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('divergence')}
                className="px-5 py-3 text-sm font-medium text-cyan-100 bg-slate-900/70 border border-cyan-500/30 rounded-xl hover:bg-slate-800/90 hover:border-cyan-400/50 transition-all cursor-pointer whitespace-nowrap"
              >
                Check Demand vs. Hype Score
              </button>
              <button
                type="button"
                onClick={() => onNavigate('forecast')}
                className="px-5 py-3 text-sm font-medium text-indigo-100 bg-slate-900/70 border border-indigo-500/30 rounded-xl hover:bg-slate-800/90 hover:border-indigo-400/50 transition-all cursor-pointer whitespace-nowrap"
              >
                View 4-Week Demand Forecast
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-400/30 bg-slate-950 aspect-video shadow-[0_20px_60px_-15px_rgba(6,182,212,0.3)]">
              <img
                src={heroImage}
                alt="DemandAura Global Consumer Demand and Market Foresight"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060B1E]/95 via-[#060B1E]/35 to-transparent flex items-end p-5">
                <div className="flex items-center gap-3">
                  <DemandAuraLogo size={36} />
                  <div className="space-y-0.5">
                    <div className="text-xs text-white font-semibold">
                      DemandAura Global Market Foresight
                    </div>
                    <div className="text-xs text-cyan-200/80">
                      Weekly Updated Signals Across 14 Countries &amp; 3 Consumer
                      Verticals
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Executive Overview Strip */}
      <section className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-aura rounded-2xl p-6 relative overflow-hidden space-y-2">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-cyan-500" />
            <div className="flex items-center justify-between text-xs font-medium text-teal-700">
              <span>Global Market Coverage</span>
              <Globe className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono-tabular">
              14 Countries × 3 Categories
            </div>
            <div className="text-xs text-slate-600">
              42 regional consumer lifestyle markets updated weekly
            </div>
          </div>

          <div className="card-aura rounded-2xl p-6 relative overflow-hidden space-y-2">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="flex items-center justify-between text-xs font-medium text-emerald-700">
              <span>Demand vs. Hype Scale</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono-tabular">
              -1.00 to +1.00
            </div>
            <div className="text-xs text-slate-600">
              Separates genuine shopper demand (+1.00) from media hype (-1.00)
            </div>
          </div>

          <div className="card-aura rounded-2xl p-6 relative overflow-hidden space-y-2">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <div className="flex items-center justify-between text-xs font-medium text-blue-700">
              <span>Search Interest Forecast</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono-tabular">
              Next 4 Weeks
            </div>
            <div className="text-xs text-slate-600">
              Weekly shopper search outlook across all 3 categories &amp; 14
              countries
            </div>
          </div>

          <div className="card-aura rounded-2xl p-6 relative overflow-hidden space-y-2">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
            <div className="flex items-center justify-between text-xs font-medium text-indigo-700">
              <span>Dynamic Market Segmentation</span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono-tabular">
              3+ Years &amp; Last 4 Weeks
            </div>
            <div className="text-xs text-slate-600">
              Continuously updated long-term and short-term market segments
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase: 3 Consumer Lifestyle Categories */}
      <section className="max-w-[1400px] mx-auto px-6 space-y-8">
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Consumer Lifestyle Coverage · 14 Global Countries
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Three High-Velocity Consumer Categories Tracked Every Week
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            DemandAura monitors weekly consumer search interest, news media
            coverage, sentiment, and purchasing power across three core
            lifestyle verticals in 14 global economies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {VALID_CATEGORIES.map((cat) => {
            const accent = CATEGORY_ACCENTS[cat.value];
            return (
              <div
                key={cat.value}
                className="card-aura rounded-2xl overflow-hidden flex flex-col justify-between relative"
              >
                <div
                  className={`h-1.5 w-full bg-gradient-to-r ${accent.topBar}`}
                />
                <div>
                  <div className="relative aspect-4/3 bg-slate-900 overflow-hidden">
                    <img
                      src={CATEGORY_IMAGES[cat.value]}
                      alt={`${cat.label} consumer category`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end p-5">
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium text-cyan-300">
                          14 Countries · 5 Consumer Topic Themes (21 Keywords)
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          {cat.label}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {cat.description}
                    </p>

                    {/* 5 Structured Keyword Groups per Category */}
                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <div className="text-xs font-semibold text-slate-900">
                        Tracked Consumer Search &amp; Media Topics:
                      </div>
                      <div className="space-y-2">
                        {cat.keywordBatches.map((batch) => (
                          <div
                            key={batch.theme}
                            className={`p-2.5 rounded-lg border text-xs leading-relaxed ${accent.themeCardBg}`}
                          >
                            <span className="font-semibold text-slate-900">
                              {batch.theme}:{' '}
                            </span>
                            <span className="text-slate-600">
                              {batch.keywords.join(' · ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('divergence')}
                    className="flex-1 py-2.5 px-3 text-xs font-semibold btn-aura-primary rounded-xl cursor-pointer whitespace-nowrap"
                  >
                    Check Demand vs. Hype
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('forecast')}
                    className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100/80 border border-slate-200 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    4-Week Forecast
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Intelligence Capabilities & Business Benefits */}
      <section className="max-w-[1400px] mx-auto px-6 space-y-8">
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Platform Capabilities · Built for Commercial Decisions
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Four Market Foresight Tools &amp; How They Help Your Business
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Each tool answers a specific commercial question—helping you decide
            where to invest marketing budget, when to stock inventory, and which
            international markets to prioritize next.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Capability 1: Divergence Score */}
          <div className="card-aura rounded-2xl p-7 flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-teal-700">
                  01 · Opportunity vs. Media Saturation Detector
                </div>
                <Activity className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Demand vs. Hype Divergence Score (-1.00 to +1.00)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Evaluates the real-time balance between organic consumer search
                interest and news/media coverage on a clear{' '}
                <strong>-1.00 to +1.00</strong> scale for any supported country
                and category.
              </p>

              <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/40 border border-teal-200/70 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-semibold text-slate-900">
                  Key benefits for your team:
                </div>
                <div className="text-slate-700 leading-relaxed">
                  <strong className="text-emerald-800">
                    Uncover Underserved Demand (+0.01 to +1.00):
                  </strong>{' '}
                  A positive score means shoppers are actively searching for
                  products while media coverage and competitor noise remain low.
                  Scale search campaigns, launch new products, and capture
                  buyers at lower acquisition costs.
                </div>
                <div className="text-slate-700 leading-relaxed">
                  <strong className="text-amber-800">
                    Filter Out Passing Media Hype (-1.00 to -0.01):
                  </strong>{' '}
                  A negative score warns you that press headlines and industry
                  buzz are louder than actual buyer intent—helping you avoid
                  wasted awareness spend and warehouse overstocking.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('divergence')}
              className="w-full py-3 px-4 text-xs font-semibold btn-aura-primary rounded-xl cursor-pointer whitespace-nowrap"
            >
              Check Demand vs. Hype Score
            </button>
          </div>

          {/* Capability 2: 4-Week Search Interest Forecast */}
          <div className="card-aura rounded-2xl p-7 flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-sky-700">
                  02 · 4-Week Forward Demand Outlook (14 Countries × 3
                  Categories)
                </div>
                <TrendingUp className="w-5 h-5 text-sky-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                4-Week Consumer Search Interest Forecast (0–100 Scale)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Projects week-by-week consumer search interest over the{' '}
                <strong>next 4 weeks</strong> across all{' '}
                <strong>3 categories</strong> and <strong>14 countries</strong>,
                accounting for recent momentum, seasonal cycles, public
                holidays, and local economic conditions.
              </p>

              <div className="bg-gradient-to-br from-sky-50/70 to-blue-50/40 border border-sky-200/70 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-semibold text-slate-900">
                  Key benefits for your team:
                </div>
                <div className="text-slate-700 leading-relaxed">
                  <strong className="text-sky-900">
                    Proactive Inventory &amp; Supply Chain Planning:
                  </strong>{' '}
                  Spot a projected demand surge 3 to 4 weeks early so your
                  operations team can move stock into regional fulfillment
                  centers before stockouts happen.
                </div>
                <div className="text-slate-700 leading-relaxed">
                  <strong className="text-sky-900">
                    Smarter Campaign &amp; Launch Timing:
                  </strong>{' '}
                  Schedule product drops, influencer partnerships, and
                  promotional budgets to hit the exact week shopper interest is
                  projected to peak.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('forecast')}
              className="w-full py-3 px-4 text-xs font-semibold btn-aura-primary rounded-xl cursor-pointer whitespace-nowrap"
            >
              Forecast Next 4 Weeks of Search Interest
            </button>
          </div>

          {/* Capability 3: Long-Term Market Segmentation */}
          <div className="card-aura rounded-2xl p-7 flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-indigo-700">
                  03 · Long-Term Market Structure (Multi-Year Historical Data)
                </div>
                <Layers className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Long-Term Strategic Market Segmentation
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Continuously groups all 42 country–category markets into
                distinct strategic profiles based on multi-year consumer search
                interest, media presence, public sentiment, and local purchasing
                power—automatically refreshing as weekly data expands.
              </p>

              <div className="bg-gradient-to-br from-indigo-50/70 to-violet-50/40 border border-indigo-200/70 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-semibold text-slate-900">
                  Key benefits for your team:
                </div>
                <div className="text-slate-700 leading-relaxed">
                  <strong className="text-indigo-950">
                    Confident International Expansion &amp; Pricing:
                  </strong>{' '}
                  Understand the enduring character of a market before committing
                  capital—separating established, high-purchasing-power growth
                  markets suited for premium product lines from emerging regions
                  that reward accessible entry pricing.
                </div>
                <div className="text-slate-700 leading-relaxed">
                  <strong className="text-indigo-950">
                    Replicate Winning Playbooks Across Similar Markets:
                  </strong>{' '}
                  When two countries share the same long-term market segment,
                  you can adapt proven merchandising and channel strategies from
                  one region to the other.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('segmentation')}
              className="w-full py-3 px-4 text-xs font-semibold btn-aura-primary rounded-xl cursor-pointer whitespace-nowrap"
            >
              Explore Long-Term Market Segments
            </button>
          </div>

          {/* Capability 4: 4-Week Recent Market Segmentation */}
          <div className="card-aura rounded-2xl p-7 flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-purple-700">
                  04 · Short-Term Momentum Radar (Latest 4-Week Window)
                </div>
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                4-Week Rolling Momentum Segmentation
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Segments the same 42 markets using the{' '}
                <strong>most recent 4 weeks of data</strong>, dynamically
                updating every week to surface newly emerging demand breakouts,
                fast-growing competitive markets, or cooling categories.
              </p>

              <div className="bg-gradient-to-br from-purple-50/70 to-fuchsia-50/40 border border-purple-200/70 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-semibold text-slate-900">
                  Key benefits for your team:
                </div>
                <div className="text-slate-700 leading-relaxed">
                  <strong className="text-purple-950">
                    Spot Market Shifts Weeks Before Competitors:
                  </strong>{' '}
                  By comparing a market&apos;s long-term segment against its
                  latest 4-week momentum profile, you immediately see when a
                  normally quiet region is experiencing a sudden surge in
                  shopper interest—or when a mature market is starting to cool.
                </div>
                <div className="text-slate-700 leading-relaxed">
                  <strong className="text-purple-950">
                    Agile Monthly Budget Reallocation:
                  </strong>{' '}
                  Direct performance marketing and promotional budgets toward
                  the specific countries accelerating right now.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('segmentation')}
              className="w-full py-3 px-4 text-xs font-semibold btn-aura-primary rounded-xl cursor-pointer whitespace-nowrap"
            >
              Explore 4-Week Momentum Segments
            </button>
          </div>
        </div>
      </section>

      {/* How Teams Combine All 4 Tools in Practice */}
      <section className="max-w-[1400px] mx-auto px-6">
        <div className="bg-aura-banner text-white rounded-2xl p-8 lg:p-10 space-y-6 border border-slate-800 shadow-xl">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              End-to-End Decision Workflow
            </div>
            <h3 className="text-2xl font-bold text-white">
              How Commercial Teams Use DemandAura Together
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Combine long-term market structure, recent 4-week momentum, the
              Demand vs. Hype Score, and the 4-Week Search Forecast to make
              complete, low-risk commercial decisions:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/75 border border-cyan-500/25 rounded-xl p-6 space-y-2.5">
              <div className="text-xs text-cyan-300 font-mono-tabular font-semibold">
                Step 01 · Compare Long-Term vs. Last 4 Weeks
              </div>
              <div className="text-base font-semibold text-white">
                Spot Structural Strength &amp; Recent Breakouts
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Start in <strong>Market Segmentation</strong> to compare a
                country&apos;s multi-year foundation alongside its latest 4-week
                momentum segment—identifying regions that are newly accelerating.
              </p>
            </div>

            <div className="bg-slate-900/75 border border-teal-500/25 rounded-xl p-6 space-y-2.5">
              <div className="text-xs text-teal-300 font-mono-tabular font-semibold">
                Step 02 · Verify Demand vs. Hype (-1.00 to +1.00)
              </div>
              <div className="text-base font-semibold text-white">
                Confirm Demand Is Genuine, Not Passing Hype
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Check the <strong>Divergence Score</strong> to verify that
                rising momentum comes from real shopper searches (+0.01 to
                +1.00) rather than short-lived media buzz (-1.00 to 0.00).
              </p>
            </div>

            <div className="bg-slate-900/75 border border-indigo-500/25 rounded-xl p-6 space-y-2.5">
              <div className="text-xs text-indigo-300 font-mono-tabular font-semibold">
                Step 03 · Forecast the Next 4 Weeks
              </div>
              <div className="text-base font-semibold text-white">
                Align Inventory &amp; Campaign Timing
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Run the <strong>4-Week Search Interest Forecast</strong> to see
                week-by-week demand across the upcoming month and schedule stock
                shipments and ad spend around the peak week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Global Markets Overview */}
      <section className="max-w-[1400px] mx-auto px-6">
        <div className="card-aura rounded-2xl p-8 space-y-6">
          <div className="max-w-2xl space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Worldwide Regional Coverage
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              14 Global Markets Tracked Continuously
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every weekly update covers 14 major economies across North
              America, Europe, Asia-Pacific, Latin America, and the Middle East
              &amp; Africa.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {VALID_COUNTRIES.map((c) => (
              <div
                key={c.value}
                className="px-3.5 py-3 bg-gradient-to-b from-white to-slate-50/80 border border-slate-200/90 hover:border-cyan-400/60 rounded-xl space-y-1 text-xs transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 truncate">
                    {c.label}
                  </span>
                  <span className="text-[10px] font-mono-tabular text-teal-700 font-semibold">
                    {c.iso2}
                  </span>
                </div>
                <div className="text-slate-500 truncate text-[11px]">
                  {c.region}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
