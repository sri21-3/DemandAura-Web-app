import React from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { formatEntityLabel } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  AppPage,
  HealthResponse,
  SegmentationRecord,
} from '../types/models';

interface DashboardPageProps {
  onNavigate: (page: AppPage) => void;
  health: HealthResponse | null;
  healthLoading: boolean;
  healthError: string | null;
  onRefreshHealth: () => void;
  overallClusters: SegmentationRecord[];
  fourWeekClusters: SegmentationRecord[];
  clustersLoading: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  health,
  healthLoading,
  healthError,
  onRefreshHealth,
  overallClusters,
  fourWeekClusters,
  clustersLoading,
}) => {
  const { user, profile, predictions } = useAuth();

  // Identify top momentum markets from 4-week segmentation
  const topMomentum4W = [...fourWeekClusters]
    .sort(
      (a, b) => b.search_interest_trend_slope - a.search_interest_trend_slope
    )
    .slice(0, 6);

  // Identify highest demand-to-media markets from 3+ year segmentation
  const topUntappedOverall = [...overallClusters]
    .sort((a, b) => b.mean_demand_to_hype_ratio - a.mean_demand_to_hype_ratio)
    .slice(0, 6);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Demand Intelligence Workspace</span>
            <span aria-hidden="true">·</span>
            <span>42 Global Markets (14 Countries × 3 Categories)</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            {user
              ? `Welcome back, ${
                  profile?.displayName || user.displayName || 'Market Planner'
                }`
              : 'Market Foresight Command Center'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefreshHealth}
            disabled={healthLoading}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`}
            />
            <span>Refresh Market Data</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('divergence')}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            + Check Demand vs. Hype Score
          </button>
        </div>
      </div>

      {/* Service & Market Coverage Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-900">
            Global Demand &amp; Media Intelligence Coverage
          </h2>
          <p className="text-xs text-slate-500">
            Tracking 14 countries and 3 consumer lifestyle verticals across 3+
            years of historical market behavior and a 4-week forward outlook.
          </p>
        </div>
        <div className="text-xs font-medium shrink-0">
          {healthLoading ? (
            <span className="text-amber-700">
              Waking up intelligence service (first connection may take up to 30
              seconds)...
            </span>
          ) : healthError ? (
            <span className="text-red-600">
              Service temporarily unreachable — click Refresh Market Data
            </span>
          ) : health?.status === 'healthy' ? (
            <span className="text-emerald-700">
              All 42 Global Markets Online &amp; Ready
            </span>
          ) : (
            <span className="text-slate-500">Connecting to market data...</span>
          )}
        </div>
      </div>

      {/* Quick-Launch Foresight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="text-xs text-slate-500">
              Opportunity &amp; Saturation Detector
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Demand vs. Hype Divergence Score
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluate any country and category on a -1.00 to +1.00 scale to
              see whether shopper demand is underserved or media-saturated.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('divergence')}
            className="text-xs font-semibold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Check Demand vs. Hype Score</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="text-xs text-slate-500">
              4-Week Forward Demand Outlook
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              4-Week Search Interest Forecast
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Project weekly consumer search interest (0–100 index) across the
              upcoming 4 weeks for 14 countries and 3 categories to time stock
              shipments and campaigns.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('forecast')}
            className="text-xs font-semibold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open 4-Week Forecaster</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="text-xs text-slate-500">
              3+ Years vs. Last 4 Weeks
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Compare Market Segmentations
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compare multi-year strategic market groups against recent 4-week
              momentum profiles across all 42 global markets, automatically
              updated each week.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('segmentation')}
            className="text-xs font-semibold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Explore Market Segments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Market Intelligence Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top 4-Week Momentum Markets */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Fastest-Rising Markets (Last 4 Weeks)
              </h3>
              <p className="text-xs text-slate-500">
                Markets with the strongest recent growth in consumer search
                interest
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('segmentation')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 underline cursor-pointer"
            >
              View All 42
            </button>
          </div>

          {clustersLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-8 bg-slate-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : topMomentum4W.length === 0 ? (
            <div className="p-6 text-xs text-slate-500">
              Loading 4-week market momentum...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-4 font-medium">Market</th>
                    <th className="py-2.5 px-4 font-medium">
                      4-Week Momentum Profile
                    </th>
                    <th className="py-2.5 px-4 font-medium text-right">
                      Search Interest
                    </th>
                    <th className="py-2.5 px-4 font-medium text-right">
                      4-Week Growth
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topMomentum4W.map((row) => (
                    <tr
                      key={`${row.country_name}-${row.category}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {formatEntityLabel(row.country_name)} ·{' '}
                        <span className="text-slate-600 font-normal">
                          {formatEntityLabel(row.category)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {row.Cluster_Name || `Group ${row.Cluster_Label ?? '-'}`}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-800">
                        {row.mean_search_interest.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular text-emerald-700 font-medium">
                        +{row.search_interest_trend_slope.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Overall Demand-to-Hype Ratio Markets */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Strongest Underserved Demand (3+ Year History)
              </h3>
              <p className="text-xs text-slate-500">
                Markets where shopper search interest consistently outpaces
                media coverage
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('segmentation')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 underline cursor-pointer"
            >
              View All 42
            </button>
          </div>

          {clustersLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-8 bg-slate-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : topUntappedOverall.length === 0 ? (
            <div className="p-6 text-xs text-slate-500">
              Loading 3+ year market profiles...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-4 font-medium">Market</th>
                    <th className="py-2.5 px-4 font-medium">
                      3+ Year Market Group
                    </th>
                    <th className="py-2.5 px-4 font-medium text-right">
                      Media Mentions
                    </th>
                    <th className="py-2.5 px-4 font-medium text-right">
                      Demand-to-Media Ratio
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topUntappedOverall.map((row) => (
                    <tr
                      key={`${row.country_name}-${row.category}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {formatEntityLabel(row.country_name)} ·{' '}
                        <span className="text-slate-600 font-normal">
                          {formatEntityLabel(row.category)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {row.Cluster_Name || `Group ${row.Cluster_Label ?? '-'}`}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-800">
                        {row.mean_media_volume.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-900 font-semibold">
                        {row.mean_demand_to_hype_ratio.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent User Prediction & Query History Preview */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Recent Market Analyses ({predictions.length})
            </h3>
            <p className="text-xs text-slate-500">
              {user
                ? 'Saved to your personal account history'
                : 'Session history (Sign in to save across devices)'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 underline cursor-pointer"
          >
            Open Full History
          </button>
        </div>

        {predictions.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="text-sm font-medium text-slate-900">
              No market analyses recorded yet
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Check a Demand vs. Hype Divergence Score or run a 4-Week Search
              Interest Forecast to automatically save your market findings here.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('divergence')}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Check Demand vs. Hype Score
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                  <th className="py-2.5 px-4 font-medium">Date &amp; Time</th>
                  <th className="py-2.5 px-4 font-medium">Analysis Tool</th>
                  <th className="py-2.5 px-4 font-medium">Market Selected</th>
                  <th className="py-2.5 px-4 font-medium">Result Summary</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {predictions.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono-tabular text-slate-500">
                      {new Date(item.createdAtIso).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {item.modelDisplayName}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {formatEntityLabel(item.countryName)} ·{' '}
                      {formatEntityLabel(item.category)}
                    </td>
                    <td className="py-2.5 px-4 font-mono-tabular font-semibold text-slate-900">
                      {item.summaryValue}
                    </td>
                    <td className="py-2.5 px-4 font-mono-tabular">
                      <span
                        className={
                          item.predictionStatus === 'error'
                            ? 'text-red-700 font-semibold'
                            : 'text-emerald-700 font-semibold'
                        }
                      >
                        {item.predictionStatus === 'error'
                          ? 'Incomplete'
                          : 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
