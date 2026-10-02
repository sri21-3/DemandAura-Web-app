import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Presentation } from 'lucide-react';
import { DEVELOPER_INFO } from '../config/api';
import { DemandAuraLogo } from './DemandAuraLogo';

interface SlideItem {
  number: string;
  section: string;
  title: string;
  subtitle: string;
  bullets: { heading: string; detail: string }[];
  footerNote: string;
}

const PRESENTATION_SLIDES: SlideItem[] = [
  {
    number: '01',
    section: 'Executive Overview',
    title: 'DemandAura — Sense the Future of Global Consumer Demand',
    subtitle:
      'End-to-End Demand Intelligence, Hype Filtering & 4-Week Demand Forecasting Across 14 Countries & 3 Lifestyle Verticals',
    bullets: [
      {
        heading: 'Core Mission',
        detail:
          'Separate genuine organic consumer demand from short-lived media hype across 42 global country–category markets.',
      },
      {
        heading: 'Global Scope',
        detail:
          '14 economies across North America, Europe, Asia-Pacific, Latin America, and Middle East & Africa × 3 consumer lifestyle verticals.',
      },
      {
        heading: 'Developer & Creator',
        detail: `${DEVELOPER_INFO.name} (${DEVELOPER_INFO.githubDisplay} · ${DEVELOPER_INFO.linkedinDisplay} · ${DEVELOPER_INFO.email})`,
      },
    ],
    footerNote:
      'Slide 01 / 10 · Title & Vision · Built for Brand, Merchandising & International Growth Teams',
  },
  {
    number: '02',
    section: 'Problem Statement',
    title: 'Why Global Brand & Merchandising Teams Misallocate Capital',
    subtitle:
      'Traditional market research struggles to separate loud press buzz from real consumer purchase intent.',
    bullets: [
      {
        heading: '01. Media Hype Distortion',
        detail:
          'Spikes in news coverage and editorial buzz often disguise flat shopper search interest—causing wasted awareness ad spend and warehouse overstocking.',
      },
      {
        heading: '02. Missed Grassroots Demand Breakouts',
        detail:
          'Organic shopper search momentum frequently accelerates 3 to 4 weeks before competitors or media outlets notice, leading to stockouts.',
      },
      {
        heading: '03. Static Geographic Market Tiers',
        detail:
          'Fixed annual market classifications ignore fast-moving 4-week momentum shifts across international regions.',
      },
    ],
    footerNote:
      'Slide 02 / 10 · Commercial Problem · Bridging Search Intent, Media Tone & Macroeconomics',
  },
  {
    number: '03',
    section: 'Data Collection & Keyword Taxonomy',
    title: '63 Curated Consumer Keywords Across 3 Categories & 14 Countries',
    subtitle:
      'Signals are collected weekly using 5 structured topic themes (21 keywords) per consumer vertical to capture full-funnel intent.',
    bullets: [
      {
        heading: 'Fashion & Beauty (21 Keywords · 5 Topic Themes)',
        detail:
          'Apparel & Designer (fashion, clothing, apparel, style, designer) · Luxury & Streetwear (luxury fashion, fast fashion, streetwear, athleisure) · Skincare & Cosmetics (skincare, makeup, cosmetics, moisturizer) · Haircare & Fragrance (anti aging, haircare, shampoo, fragrance) · Footwear & Jewelry (perfume, beauty treatment, sneakers, jewelry).',
      },
      {
        heading: 'Fitness & Wearables (21 Keywords · 5 Topic Themes)',
        detail:
          'Gym & Strength (fitness, exercise, workout, training, gym) · Studio Workouts (yoga, pilates, aerobics, hiit) · Endurance Sports (crossfit, cardio, running, cycling) · Smartwatches (wearable, smartwatch, fitness tracker, garmin) · Connected Biometrics (fitbit, apple watch, heart rate monitor, step counter).',
      },
      {
        heading: 'Nutrition & Diets (21 Keywords · 5 Topic Themes)',
        detail:
          'Plant-Based (diet, nutrition, vegan, vegetarian, plant based) · Low-Carb & Fasting (keto, paleo, low carb, intermittent fasting) · Superfoods & Wellness (detox, superfood, organic, weight loss) · Sports Supplements (supplement, protein powder, whey, creatine) · Gut Health & Vitamins (vitamin, minerals, probiotics, functional food).',
      },
    ],
    footerNote:
      'Slide 03 / 10 · Keyword Taxonomy · 14 Countries × 3 Categories = 42 Regional Markets',
  },
  {
    number: '04',
    section: 'Data Pipeline & Feature Engineering',
    title: 'Four Real-World Data Pillars & Weekly ETL Pipeline',
    subtitle:
      'Multi-source weekly ingestion combining consumer search trends, global news tone, macroeconomic indicators, and retail calendars.',
    bullets: [
      {
        heading: 'Pillar 1 · Consumer Search Trends (Google Trends)',
        detail:
          'Weekly 0–100 search popularity index, 1W/2W/4W lags, 4-week rolling mean & volatility (std), search velocity (1st derivative), and search acceleration (2nd derivative).',
      },
      {
        heading: 'Pillar 2 · Global News Volume & Sentiment (GDELT)',
        detail:
          'Weekly article volume, log-scaled media volume, 4-week rolling media mean, net editorial sentiment, emotional polarity, launch activity density, and publisher diversity.',
      },
      {
        heading: 'Pillars 3 & 4 · Macroeconomics (World Bank) & Seasonal Calendar',
        detail:
          'GDP per capita (USD purchasing power), annual inflation rate (%), internet penetration (%), national public holiday counts, and cyclical week encodings (sin_week, cos_week).',
      },
    ],
    footerNote:
      'Slide 04 / 10 · Data Engineering · Automated Weekly Feature Computation',
  },
  {
    number: '05',
    section: 'Predictive Model 01 · XGBoost Regressor',
    title: 'Demand vs. Hype Divergence Score (-1.00 to +1.00)',
    subtitle:
      'Quantifies whether organic consumer search momentum is outpacing or lagging behind media coverage in real time.',
    bullets: [
      {
        heading: 'Model Architecture & Feature Pipeline (29 Ordered Features)',
        detail:
          'XGBRegressor (n_estimators=500, learning_rate=0.05, max_depth=5, subsample=0.8) trained on 11 StandardScaler numerical features, 1 unscaled numerical feature (log_media_volume), and 17 OneHotEncoded country/category features.',
      },
      {
        heading: 'Validation Accuracy',
        detail:
          'Train R² = 0.98 (RMSE = 0.04) · Test R² = 0.84 (RMSE = 0.11) across multi-year out-of-sample testing.',
      },
      {
        heading: 'Commercial Decision Rule',
        detail:
          'Positive Score (+0.01 to +1.00): Underserved shopper demand—scale paid search & inventory. Negative Score (-1.00 to -0.01): Media hype saturation—avoid broad awareness spend.',
      },
    ],
    footerNote:
      'Slide 05 / 10 · API Endpoint: POST /predict/divergence · Real-Time Opportunity Detector',
  },
  {
    number: '06',
    section: 'Predictive Model 02 · LightGBM Regressor',
    title: '4-Week Consumer Search Interest Forecaster (0–100 Scale)',
    subtitle:
      'Projects week-by-week consumer search interest across the upcoming 4 weeks for any country and lifestyle category.',
    bullets: [
      {
        heading: 'Model Architecture & Feature Pipeline (16 Ordered Features)',
        detail:
          'Recursive multi-step LGBMRegressor (n_estimators=1000, learning_rate=0.02, num_leaves=31) using native categoricals, lagged search interest (t-1, t-2, t-4), velocity/acceleration lags, 4W rolling stats, macro indicators, and sin/cos seasonality.',
      },
      {
        heading: 'Validation Accuracy',
        detail:
          'Train R² = 0.97 (RMSE = 3.15) · Test R² = 0.88 (RMSE = 6.74) on 0–100 search popularity scale.',
      },
      {
        heading: 'Commercial Decision Rule',
        detail:
          'Identify the projected Peak Week 3 to 4 weeks early to pre-position regional fulfillment stock and time promotional product launches.',
      },
    ],
    footerNote:
      'Slide 06 / 10 · API Endpoint: POST /forecast/search-interest · 4-Week Forward Demand Outlook',
  },
  {
    number: '07',
    section: 'Unsupervised Models 03 & 04 · Market Segmentation',
    title: 'Dual-Horizon Market Segmentation: 3+ Years vs. Last 4 Weeks',
    subtitle:
      'Groups all 42 Country × Category markets across 6 fingerprint metrics: Search Interest, Media Volume, Demand-to-Media Ratio, Trend Slope, Net Sentiment, and GDP per Capita.',
    bullets: [
      {
        heading: 'Long-Term Structural Segmentation (3+ Year History)',
        detail:
          'Groups markets into enduring strategic profiles (e.g., Premium Organic Growth Engines, High-Income Latent Demand, Emerging Volatile Markets, Hyper-Hyped Premium Outlier) to guide international expansion and pricing tiers.',
      },
      {
        heading: 'Short-Term Momentum Segmentation (Latest 4-Week Window)',
        detail:
          'Refreshes weekly on the latest 4 weeks of data (e.g., Untapped High-Demand Niches, High-Sentiment Seed Markets, Explosive Grassroots Opportunities, Fast-Growing High-Competition Waves) to catch sudden breakouts early.',
      },
      {
        heading: 'Cross-Horizon Comparison',
        detail:
          'Comparing a market’s 3+ year foundation with its latest 4-week profile immediately reveals newly accelerating or cooling markets.',
      },
    ],
    footerNote:
      'Slide 07 / 10 · API Endpoints: GET /clusters/market-segmentation & GET /clusters/4-weeks-segmentation',
  },
  {
    number: '08',
    section: 'Automated Weekly Reporting Pipeline',
    title: 'Dynamic Weekly Executive Reports & Natural-Language Insights',
    subtitle:
      'Every week, the backend generates updated Markdown reports that the frontend parses dynamically into interactive segment briefings.',
    bullets: [
      {
        heading: '01. Automated Weekly Regeneration',
        detail:
          'As weekly data updates, the backend regenerates /reports/market-segmentation and /reports/4-weeks-segmentation with the newly discovered segment names and counts.',
      },
      {
        heading: '02. Dynamic Frontend Report Parser',
        detail:
          'Automatically extracts Section 1 (Executive Summary Table) and Section 2 (Detailed Segment Breakdown) without hardcoding segment counts or static descriptions.',
      },
      {
        heading: '03. Executive Decision Fields Per Segment',
        detail:
          'Surfaces Metric Trends, Business Interpretation, Recommended Business Use Case, and Core Business Question Answered across the Dashboard, Divergence, and Segmentation views.',
      },
    ],
    footerNote:
      'Slide 08 / 10 · API Endpoints: GET /reports/market-segmentation & GET /reports/4-weeks-segmentation',
  },
  {
    number: '09',
    section: 'Full-Stack Production Architecture',
    title: 'Cloud-Native Architecture, Security & Data Persistence',
    subtitle:
      'Engineered for reliability, strict schema validation, and multi-device analyst workflows.',
    bullets: [
      {
        heading: 'Frontend & Workspace UX (React 19 + TypeScript + Tailwind + Recharts)',
        detail:
          'Clean top navigation (Home, About, Contact, Dashboard) paired with a dedicated Workspace Sidebar (Divergence, Forecast, Segmentation, History) and interactive charts.',
      },
      {
        heading: 'Express Proxy Gateway & FastAPI Backend (demandaura.onrender.com)',
        detail:
          'Server-side proxy (/api/ml/*) with cold-start telemetry, strict payload sanitization, and runtime JSON response schema validation.',
      },
      {
        heading: 'Firebase Authentication & Cloud Firestore Persistence',
        detail:
          'Google OAuth & Email/Password authentication with UID-scoped Firestore security rules storing saved predictions, planning notes, and analyst profiles.',
      },
    ],
    footerNote:
      'Slide 09 / 10 · Production Stack · FastAPI + Express + React 19 + Firebase Firestore',
  },
  {
    number: '10',
    section: 'Commercial Impact & Conclusion',
    title: 'Three-Step Executive Workflow with DemandAura',
    subtitle:
      'Combining all four models into a repeatable weekly decision process.',
    bullets: [
      {
        heading: 'Step 01 · Segment (3+ Years vs. Last 4 Weeks)',
        detail:
          'Identify high-potential markets in Premium Organic Growth Engines or Explosive Grassroots Opportunities using the weekly updated segment reports.',
      },
      {
        heading: 'Step 02 · Verify (Demand vs. Hype Divergence Score)',
        detail:
          'Confirm a positive Divergence Score (+0.01 to +1.00) so marketing and inventory capital is deployed into genuine shopper demand rather than media hype.',
      },
      {
        heading: 'Step 03 · Forecast (4-Week Search Interest Outlook)',
        detail:
          'Project the next 4 weeks of search interest (0–100 scale) to pre-position inventory and launch campaigns right before the peak demand week.',
      },
    ],
    footerNote: `Slide 10 / 10 · Thank You · Designed & Developed by ${DEVELOPER_INFO.name}`,
  },
];

export const PresentationDeck: React.FC = () => {
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const currentSlide = PRESENTATION_SLIDES[activeSlideIdx];

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Presentation className="w-3.5 h-3.5" />
            <span>Minimalistic Project Presentation Deck (10 Slides)</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            05. Project Presentation Deck (Interactive &amp; Downloadable .PPTX)
          </h2>
          <p className="text-sm text-slate-600">
            Browse the minimalistic 10-slide executive presentation below or
            download the ready-to-present PowerPoint file (
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
              DemandAura_Presentation.pptx
            </code>
            ).
          </p>
        </div>

        <a
          href="/DemandAura_Presentation.pptx"
          download="DemandAura_Presentation.pptx"
          className="px-4 py-2.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap self-start"
        >
          <Download className="w-4 h-4" />
          <span>Download PowerPoint (.pptx)</span>
        </a>
      </div>

      {/* 16:9 Minimalist Slide Canvas */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Top Slide Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <DemandAuraLogo size={24} />
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
              {currentSlide.number} · {currentSlide.section}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setActiveSlideIdx((prev) =>
                  prev > 0 ? prev - 1 : PRESENTATION_SLIDES.length - 1
                )
              }
              aria-label="Previous slide"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono-tabular text-slate-300 px-2">
              {activeSlideIdx + 1} / {PRESENTATION_SLIDES.length}
            </span>
            <button
              type="button"
              onClick={() =>
                setActiveSlideIdx((prev) =>
                  prev < PRESENTATION_SLIDES.length - 1 ? prev + 1 : 0
                )
              }
              aria-label="Next slide"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <div className="p-8 lg:p-12 space-y-8 min-h-[420px] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-2 border-b border-slate-200 pb-5">
              <h3 className="text-2xl lg:text-3xl font-semibold text-slate-900 tracking-tight">
                {currentSlide.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
                {currentSlide.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {currentSlide.bullets.map((b) => (
                <div
                  key={b.heading}
                  className="p-5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2"
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {b.heading}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {b.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Slide Footer & Slide Dots */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
            <div>{currentSlide.footerNote}</div>
            <div className="flex items-center gap-1.5">
              {PRESENTATION_SLIDES.map((s, idx) => (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => setActiveSlideIdx(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === activeSlideIdx
                      ? 'w-6 bg-slate-900'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
