import React from 'react';
import { ArrowRight } from 'lucide-react';
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

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>Demand Intelligence &amp; Market Foresight Platform</span>
              <span aria-hidden="true">·</span>
              <span>14 Global Countries</span>
              <span aria-hidden="true">·</span>
              <span>3 Consumer Lifestyle Categories</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <DemandAuraLogo size={56} className="rounded-full shadow-lg" />
                <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white leading-[1.08]">
                  DemandAura
                </h1>
              </div>
              <p
                className="text-xl sm:text-2xl font-medium text-slate-200 tracking-tight"
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

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-2.5 text-sm font-medium bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Open Intelligence Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('divergence')}
                className="px-5 py-2.5 text-sm font-medium text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                Check Demand vs. Hype Score
              </button>
              <button
                type="button"
                onClick={() => onNavigate('forecast')}
                className="px-5 py-2.5 text-sm font-medium text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                View 4-Week Demand Forecast
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video">
              <img
                src={heroImage}
                alt="DemandAura Global Consumer Demand and Market Foresight"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex items-end p-5">
                <div className="flex items-center gap-3">
                  <DemandAuraLogo size={32} />
                  <div className="space-y-0.5">
                    <div className="text-xs text-slate-200 font-medium">
                      DemandAura Global Market Foresight
                    </div>
                    <div className="text-xs text-slate-400">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-b border-slate-200 pb-12">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Global Market Coverage</div>
            <div className="text-2xl font-semibold text-slate-900 font-mono-tabular">
              14 Countries × 3 Categories
            </div>
            <div className="text-xs text-slate-500">
              42 regional consumer lifestyle markets updated weekly
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500">
              Demand vs. Hype Scale
            </div>
            <div className="text-2xl font-semibold text-slate-900 font-mono-tabular">
              -1.00 to +1.00
            </div>
            <div className="text-xs text-slate-500">
              Separates genuine shopper demand (+1.00) from media hype (-1.00)
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500">
              Search Interest Forecast
            </div>
            <div className="text-2xl font-semibold text-slate-900 font-mono-tabular">
              Next 4 Weeks
            </div>
            <div className="text-xs text-slate-500">
              Weekly shopper search outlook across all 3 categories &amp; 14
              countries
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500">
              Dynamic Market Segmentation
            </div>
            <div className="text-2xl font-semibold text-slate-900 font-mono-tabular">
              3+ Years &amp; Last 4 Weeks
            </div>
            <div className="text-xs text-slate-500">
              Continuously updated long-term and short-term market groupings
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase: 3 Consumer Lifestyle Categories */}
      <section className="max-w-[1400px] mx-auto px-6 space-y-8">
        <div className="max-w-3xl space-y-2">
          <div className="text-xs text-slate-500">
            Consumer Lifestyle Coverage · 14 Global Countries
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Three High-Velocity Consumer Categories Tracked Every Week
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            DemandAura monitors weekly consumer search interest, news media
            coverage, sentiment, and purchasing power across three core
            lifestyle verticals in 14 global economies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VALID_CATEGORIES.map((cat) => (
            <div
              key={cat.value}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="aspect-4/3 bg-slate-100 overflow-hidden border-b border-slate-100">
                  <img
                    src={CATEGORY_IMAGES[cat.value]}
                    alt={`${cat.label} consumer category`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-500">
                      14 Countries · 5 Consumer Topic Clusters (21 Keywords)
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  {/* 5 Structured Keyword Groups per Category */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="text-xs font-semibold text-slate-900">
                      Tracked Consumer Search &amp; Media Topics:
                    </div>
                    <div className="space-y-2">
                      {cat.keywordBatches.map((batch) => (
                        <div
                          key={batch.theme}
                          className="text-xs leading-relaxed"
                        >
                          <span className="font-medium text-slate-800">
                            {batch.theme}:{' '}
                          </span>
                          <span className="text-slate-500">
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
                  className="flex-1 py-2 px-3 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Check Demand vs. Hype
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('forecast')}
                  className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  4-Week Forecast
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Intelligence Capabilities & Business Benefits */}
      <section className="max-w-[1400px] mx-auto px-6 space-y-8">
        <div className="max-w-3xl space-y-2">
          <div className="text-xs text-slate-500">
            Platform Capabilities · Built for Commercial Decisions
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
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
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                01 · Opportunity vs. Media Saturation Detector
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Demand vs. Hype Divergence Score (-1.00 to +1.00)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Evaluates the real-time balance between organic consumer search
                interest and news/media coverage on a clear{' '}
                <strong>-1.00 to +1.00</strong> scale for any supported country
                and category.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs">
                <div className="font-semibold text-slate-900">
                  Key benefits for your team:
                </div>
                <div className="text-slate-600 leading-relaxed">
                  <strong className="text-emerald-800">
                    Uncover Underserved Demand (+0.01 to +1.00):
                  </strong>{' '}
                  A positive score means shoppers are actively searching for
                  products while media coverage and competitor noise remain low.
                  Scale search campaigns, launch new products, and capture
                  buyers at lower acquisition costs.
                </div>
                <div className="text-slate-600 leading-relaxed">
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
              className="w-full py-2.5 px-4 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Check Demand vs. Hype Score
            </button>
          </div>

          {/* Capability 2: 4-Week Search Interest Forecast */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                02 · 4-Week Forward Demand Outlook (14 Countries × 3 Categories)
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                4-Week Consumer Search Interest Forecast (0–100 Scale)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Projects week-by-week consumer search interest over the{' '}
                <strong>next 4 weeks</strong> across all{' '}
                <strong>3 categories</strong> and <strong>14 countries</strong>,
                accounting for recent momentum, seasonal cycles, public
                holidays, and local economic conditions.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs">
                <div className="font-semibold text-slate-900">
                  Key benefits for your team:
                </div>
                <div className="text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">
                    Proactive Inventory &amp; Supply Chain Planning:
                  </strong>{' '}
                  Spot a projected demand surge 3 to 4 weeks early so your
                  operations team can move stock into regional fulfillment
                  centers before stockouts happen.
                </div>
                <div className="text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">
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
              className="w-full py-2.5 px-4 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Forecast Next 4 Weeks of Search Interest
            </button>
          </div>

          {/* Capability 3: Long-Term Market Segmentation */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                03 · Long-Term Market Structure (Multi-Year Historical Data)
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Long-Term Strategic Market Segmentation
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Continuously groups all 42 country–category markets into
                distinct strategic profiles based on multi-year consumer search
                interest, media presence, public sentiment, and local purchasing
                power—automatically refreshing as weekly data expands.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs">
                <div className="font-semibold text-slate-900">
                  Key benefits for your team:
                </div>
                <div className="text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">
                    Confident International Expansion &amp; Pricing:
                  </strong>{' '}
                  Understand the enduring character of a market before committing
                  capital—separating established, high-purchasing-power growth
                  markets suited for premium product lines from emerging regions
                  that reward accessible entry pricing.
                </div>
                <div className="text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">
                    Replicate Winning Playbooks Across Similar Markets:
                  </strong>{' '}
                  When two countries fall into the same long-term market group,
                  you can adapt proven merchandising and channel strategies from
                  one region to the other.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('segmentation')}
              className="w-full py-2.5 px-4 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Explore Long-Term Market Segments
            </button>
          </div>

          {/* Capability 4: 4-Week Recent Market Segmentation */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                04 · Short-Term Momentum Radar (Latest 4-Week Window)
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                4-Week Rolling Momentum Segmentation
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Segments the same 42 markets using the{' '}
                <strong>most recent 4 weeks of data</strong>, dynamically
                updating every week to surface newly emerging demand breakouts,
                fast-growing competitive markets, or cooling categories.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs">
                <div className="font-semibold text-slate-900">
                  Key benefits for your team:
                </div>
                <div className="text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">
                    Spot Market Shifts Weeks Before Competitors:
                  </strong>{' '}
                  By comparing a market&apos;s long-term profile against its
                  latest 4-week momentum segment, you immediately see when a
                  normally quiet region is experiencing a sudden surge in
                  shopper interest—or when a mature market is starting to cool.
                </div>
                <div className="text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">
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
              className="w-full py-2.5 px-4 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Explore 4-Week Momentum Segments
            </button>
          </div>
        </div>
      </section>

      {/* Practical Guide: Understanding the Divergence Score Range (-1.00 to +1.00) */}
      <section className="max-w-[1400px] mx-auto px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs text-slate-500">
              Decision Guide · Reading the Demand vs. Hype Scale
            </div>
            <h3 className="text-xl font-semibold text-slate-900">
              How to Read the Divergence Score (-1.00 to +1.00)
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              The Divergence Score gives your team a single, intuitive benchmark
              on a <strong>-1.00 to +1.00</strong> scale to decide how to
              approach any country and category:
            </p>
          </div>

          {/* Visual Spectrum Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap justify-between text-xs text-slate-500 font-mono-tabular gap-2">
              <span className="text-amber-800 font-semibold">
                -1.00 (Media Hype &amp; Saturation)
              </span>
              <span className="text-slate-700 font-semibold">
                0.00 (Balanced Demand &amp; Media)
              </span>
              <span className="text-emerald-800 font-semibold">
                +1.00 (Strong Underserved Consumer Demand)
              </span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden flex border border-slate-200">
              <div
                className="bg-amber-500/80 h-full"
                style={{ width: '42%' }}
                title="Over-Hyped Market Zone (-1.00 to -0.05)"
              />
              <div
                className="bg-slate-400 h-full"
                style={{ width: '16%' }}
                title="Balanced Zone (-0.05 to +0.20)"
              />
              <div
                className="bg-emerald-600 h-full"
                style={{ width: '42%' }}
                title="Underserved Demand Zone (+0.20 to +1.00)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="text-xs font-mono-tabular font-semibold text-amber-900">
                -1.00 to -0.05
              </div>
              <div className="text-sm font-semibold text-slate-900">
                Media-Saturated / Over-Hyped Market
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Press coverage and industry chatter are outpacing actual shopper
                search interest. Avoid expensive top-of-funnel awareness ads,
                keep inventory lean, and focus on converting existing buyers.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-mono-tabular font-semibold text-slate-700">
                -0.05 to +0.20
              </div>
              <div className="text-sm font-semibold text-slate-900">
                Balanced Demand &amp; Media Growth
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consumer search appetite and media visibility are moving in
                step. Maintain steady warehouse replenishment and a balanced mix
                of brand storytelling and performance marketing.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="text-xs font-mono-tabular font-semibold text-emerald-900">
                +0.20 to +1.00
              </div>
              <div className="text-sm font-semibold text-slate-900">
                Underserved Consumer Demand
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Shoppers are actively searching for products, but media and
                competitor coverage have not caught up. Prioritize this market
                for product launches, search marketing, and expanded stock.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Teams Combine All 4 Tools in Practice */}
      <section className="max-w-[1400px] mx-auto px-6">
        <div className="bg-slate-900 text-white rounded-xl p-8 space-y-6">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs text-slate-400">
              End-to-End Decision Workflow
            </div>
            <h3 className="text-xl font-semibold text-white">
              How Commercial Teams Use DemandAura Together
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Combine long-term market structure, recent 4-week momentum, the
              Demand vs. Hype Score, and the 4-Week Search Forecast to make
              complete, low-risk commercial decisions:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-2">
              <div className="text-xs text-slate-400 font-mono-tabular">
                Step 01 · Compare Long-Term vs. Last 4 Weeks
              </div>
              <div className="text-sm font-semibold text-white">
                Spot Structural Strength &amp; Recent Breakouts
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Start in <strong>Market Segmentation</strong> to compare a
                country&apos;s multi-year foundation alongside its latest 4-week
                momentum segment—identifying regions that are newly accelerating.
              </p>
            </div>

            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-2">
              <div className="text-xs text-slate-400 font-mono-tabular">
                Step 02 · Verify Demand vs. Hype (-1.00 to +1.00)
              </div>
              <div className="text-sm font-semibold text-white">
                Confirm Demand Is Genuine, Not Passing Hype
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Check the <strong>Divergence Score</strong> to verify that
                rising momentum comes from real shopper searches (+0.01 to
                +1.00) rather than short-lived media buzz (-1.00 to 0.00).
              </p>
            </div>

            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-2">
              <div className="text-xs text-slate-400 font-mono-tabular">
                Step 03 · Forecast the Next 4 Weeks
              </div>
              <div className="text-sm font-semibold text-white">
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
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div className="max-w-2xl space-y-1.5">
            <h3 className="text-lg font-semibold text-slate-900">
              14 Global Markets Tracked Continuously
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every weekly update covers 14 major economies across North
              America, Europe, Asia-Pacific, Latin America, and the Middle East
              &amp; Africa.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
            {VALID_COUNTRIES.map((c) => (
              <div
                key={c.value}
                className="px-3 py-2.5 border border-slate-200 rounded-lg space-y-0.5 text-xs"
              >
                <div className="font-semibold text-slate-900 truncate">
                  {c.label}
                </div>
                <div className="text-slate-400 truncate">{c.region}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
