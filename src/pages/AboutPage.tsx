import React from 'react';
import aboutImage from '../assets/images/about_pipeline_architecture_1790705597994.jpg';
import { DemandAuraLogo } from '../components/DemandAuraLogo';
import {
  DEVELOPER_INFO,
  FEATURE_DESCRIPTIONS,
  VALID_CATEGORIES,
} from '../config/api';
import { AppPage } from '../types/models';

interface AboutPageProps {
  onNavigate: (page: AppPage) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12 space-y-16">
      {/* Hero Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pb-12 border-b border-slate-200">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2.5 text-xs text-slate-500">
            <DemandAuraLogo size={28} />
            <span>
              DemandAura · Platform Overview · Keyword Coverage · Decision Guide
            </span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Turning Global Search &amp; Media Signals into Confident Market
            Decisions
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            DemandAura is a Demand Intelligence &amp; Market Foresight Platform
            designed for brand leaders, merchandise planners, and international
            growth teams. By comparing real consumer search behavior against
            global news coverage and local economic conditions across 14
            countries and 3 consumer categories, the platform helps you invest
            ahead of real demand—and avoid paying for passing media hype.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('divergence')}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              Check Demand vs. Hype Score
            </button>
            <button
              type="button"
              onClick={() => onNavigate('forecast')}
              className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Open 4-Week Forecaster
            </button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-4/3">
            <img
              src={aboutImage}
              alt="DemandAura Global Market Foresight Overview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Real-World Information Sources */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">
            01. Four Real-World Pillars Behind Every Market Insight
          </h2>
          <p className="text-sm text-slate-600">
            Updated weekly across 14 countries and 3 lifestyle verticals (42
            regional markets tracked continuously).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <div className="text-xs text-slate-500">
              Pillar 01 · Shopper Intent
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Consumer Search Trends
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tracks weekly consumer search popularity and momentum across 63
              curated consumer keywords in Fashion &amp; Beauty, Fitness &amp;
              Wearables, and Nutrition &amp; Diets to measure genuine buyer
              interest.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <div className="text-xs text-slate-500">
              Pillar 02 · Media &amp; Press Buzz
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Global News Volume &amp; Sentiment
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Measures how heavily news outlets and publishers are covering each
              category, along with whether editorial sentiment is positive,
              neutral, or critical.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <div className="text-xs text-slate-500">
              Pillar 03 · Economic Context
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Purchasing Power &amp; Inflation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Accounts for local household purchasing power (GDP per capita),
              consumer price inflation, and digital internet reach in each of
              the 14 countries.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <div className="text-xs text-slate-500">
              Pillar 04 · Seasonal Calendar
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Public Holidays &amp; Seasonal Cycles
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Incorporates national shopping holidays and annual seasonal cycles
              so forecasts reflect real-world retail calendars.
            </p>
          </div>
        </div>
      </section>

      {/* Consumer Category & Keyword Taxonomy */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">
            02. Consumer Category &amp; Keyword Taxonomy (How Signals Are
            Collected)
          </h2>
          <p className="text-sm text-slate-600 max-w-3xl">
            Each of our 3 consumer lifestyle verticals is built from{' '}
            <strong>5 structured consumer topic themes</strong> (21 search
            keywords per category, 63 keywords total) tracked weekly across all
            14 countries:
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {VALID_CATEGORIES.map((cat) => (
            <div
              key={cat.value}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="border-b border-slate-100 pb-3 space-y-1">
                <div className="text-xs text-slate-500">
                  5 Topic Themes · 21 Tracked Keywords
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {cat.label}
                </h3>
                <p className="text-xs text-slate-600">{cat.description}</p>
              </div>

              <div className="space-y-3">
                {cat.keywordBatches.map((batch, idx) => (
                  <div
                    key={batch.theme}
                    className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1"
                  >
                    <div className="text-xs font-semibold text-slate-900">
                      0{idx + 1}. {batch.theme}
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed">
                      {batch.keywords.join(' · ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How the Four Foresight Capabilities Work for You */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">
            03. How Our Four Foresight Tools Guide Your Decisions
          </h2>
          <p className="text-sm text-slate-600">
            Each capability is designed to answer a distinct commercial question
            for marketing, merchandising, and expansion teams.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="text-xs text-slate-500">
              Tool 01 · Opportunity vs. Media Saturation
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Demand vs. Hype Divergence Score (-1.00 to +1.00)
            </h3>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <strong>What it tells you:</strong> Whether consumer search
                appetite is ahead of media coverage (+0.01 to +1.00) or lagging
                behind media hype (-1.00 to -0.01).
              </p>
              <p>
                <strong>How to act on it:</strong> Focus product launches, paid
                search capture, and inventory expansion in positive-scoring
                markets where shopper demand is underserved. In negative-scoring
                markets, avoid expensive broad awareness campaigns.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="text-xs text-slate-500">
              Tool 02 · 4-Week Forward Demand Outlook
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              4-Week Consumer Search Interest Forecast (14 Countries × 3
              Categories)
            </h3>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <strong>What it tells you:</strong> Projected week-by-week
                consumer search interest (0–100 scale) across the next 4 weeks
                for any country and lifestyle vertical.
              </p>
              <p>
                <strong>How to act on it:</strong> Pre-position regional
                inventory 3 to 4 weeks ahead of a projected demand climb to
                prevent stockouts, and time promotional campaigns to launch just
                before the peak week.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="text-xs text-slate-500">
              Tool 03 · Multi-Year Historical Market Structure
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Long-Term Strategic Market Segmentation (3+ Years of Data)
            </h3>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <strong>What it tells you:</strong> Dynamically groups all 42
                global markets into enduring strategic profiles using multi-year
                historical demand, media, sentiment, and purchasing power data,
                refreshing automatically as weekly data grows.
              </p>
              <p>
                <strong>How to act on it:</strong> Tailor long-term pricing,
                product tiering, and market entry strategies to each country’s
                structural profile—separating mature premium growth markets from
                emerging value-driven regions.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="text-xs text-slate-500">
              Tool 04 · Most Recent 4 Weeks of Market Activity
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Recent 4-Week Momentum Segmentation
            </h3>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <strong>What it tells you:</strong> Dynamically groups the same
                42 markets into short-term momentum profiles based on the latest
                4 weeks of search and media shifts, updated every week.
              </p>
              <p>
                <strong>How to act on it:</strong> Compare a market’s long-term
                group with its latest 4-week profile to spot sudden grassroots
                breakouts or early signs of market fatigue, and reallocate
                monthly marketing budgets accordingly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Indicator Glossary */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">
            04. Market Indicators Explained
          </h2>
          <p className="text-sm text-slate-600">
            Plain-language guide to the demand, media, seasonal, and economic
            signals tracked across all 42 markets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(FEATURE_DESCRIPTIONS).map(([key, item]) => (
            <div
              key={key}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-1"
            >
              <div className="text-xs text-slate-400">{item.group}</div>
              <div className="text-sm font-semibold text-slate-900">
                {item.label}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Developer Attribution Card */}
      <section className="bg-slate-900 text-white rounded-xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-slate-400">
            Platform Creator &amp; Developer
          </div>
          <h2 className="text-2xl font-semibold text-white">
            Designed &amp; Developed by {DEVELOPER_INFO.name}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Built to empower commercial teams with clear, actionable consumer
            demand intelligence across 14 global markets and 3 high-velocity
            lifestyle categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href={DEVELOPER_INFO.github}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 text-xs font-medium bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            GitHub ({DEVELOPER_INFO.githubDisplay})
          </a>
          <a
            href={DEVELOPER_INFO.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 text-xs font-medium text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            LinkedIn ({DEVELOPER_INFO.linkedinDisplay})
          </a>
          <a
            href={`mailto:${DEVELOPER_INFO.email}`}
            className="px-4 py-2.5 text-xs font-medium text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            {DEVELOPER_INFO.email}
          </a>
        </div>
      </section>
    </div>
  );
};
