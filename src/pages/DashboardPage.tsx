import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowRight,
  Clock,
  Globe,
  Layers,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { formatEntityLabel } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  AppPage,
  HealthResponse,
  MarkdownReportResponse,
  SegmentationRecord,
} from '../types/models';
import { parseSegmentationReport } from '../utils/reportParser';

interface DashboardPageProps {
  onNavigate: (page: AppPage) => void;
  health: HealthResponse | null;
  healthLoading: boolean;
  healthError: string | null;
  onRefreshHealth: () => void;
  overallClusters: SegmentationRecord[];
  fourWeekClusters: SegmentationRecord[];
  clustersLoading: boolean;
  overallReport?: MarkdownReportResponse | null;
  fourWeekReport?: MarkdownReportResponse | null;
  reportsLoading?: boolean;
}

const SEGMENT_COLORS = [
  '#0D9488', // Teal
  '#0284C7', // Sky Blue
  '#4F46E5', // Indigo
  '#7C3AED', // Violet
  '#059669', // Emerald
  '#D97706', // Amber
  '#E11D48', // Rose
];

const SEGMENT_CARD_STYLES = [
  {
    topBar: 'from-teal-400 to-cyan-500',
    bg: 'bg-teal-50/40 border-teal-200/70',
    badge: 'text-teal-800 bg-teal-100/80',
  },
  {
    topBar: 'from-sky-400 to-blue-600',
    bg: 'bg-sky-50/40 border-sky-200/70',
    badge: 'text-sky-800 bg-sky-100/80',
  },
  {
    topBar: 'from-indigo-400 to-violet-600',
    bg: 'bg-indigo-50/40 border-indigo-200/70',
    badge: 'text-indigo-800 bg-indigo-100/80',
  },
  {
    topBar: 'from-purple-400 to-fuchsia-600',
    bg: 'bg-purple-50/40 border-purple-200/70',
    badge: 'text-purple-800 bg-purple-100/80',
  },
  {
    topBar: 'from-emerald-400 to-teal-600',
    bg: 'bg-emerald-50/40 border-emerald-200/70',
    badge: 'text-emerald-800 bg-emerald-100/80',
  },
  {
    topBar: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50/40 border-amber-200/70',
    badge: 'text-amber-900 bg-amber-100/80',
  },
  {
    topBar: 'from-rose-400 to-pink-600',
    bg: 'bg-rose-50/40 border-rose-200/70',
    badge: 'text-rose-800 bg-rose-100/80',
  },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  health,
  healthLoading,
  healthError,
  onRefreshHealth,
  overallClusters,
  fourWeekClusters,
  clustersLoading,
  overallReport = null,
  fourWeekReport = null,
  reportsLoading = false,
}) => {
  const { user, profile, predictions } = useAuth();
  const [reportHorizon, setReportHorizon] = useState<'overall' | '4w'>('4w');

  const parsedOverallReport = useMemo(
    () => parseSegmentationReport(overallReport, overallClusters),
    [overallReport, overallClusters]
  );

  const parsed4WReport = useMemo(
    () => parseSegmentationReport(fourWeekReport, fourWeekClusters),
    [fourWeekReport, fourWeekClusters]
  );

  const activeDashboardReport =
    reportHorizon === 'overall' ? parsedOverallReport : parsed4WReport;

  // Identify top momentum markets from 4-week segmentation
  const topMomentum4W = useMemo(
    () =>
      [...fourWeekClusters]
        .sort(
          (a, b) =>
            b.search_interest_trend_slope - a.search_interest_trend_slope
        )
        .slice(0, 6),
    [fourWeekClusters]
  );

  // Identify highest demand-to-media markets from 3+ year segmentation
  const topUntappedOverall = useMemo(
    () =>
      [...overallClusters]
        .sort(
          (a, b) => b.mean_demand_to_hype_ratio - a.mean_demand_to_hype_ratio
        )
        .slice(0, 6),
    [overallClusters]
  );

  // Prepare visual chart data for Top 4-Week Rising Markets
  const risingMarketsChartData = useMemo(
    () =>
      topMomentum4W.map((r) => ({
        marketLabel: `${formatEntityLabel(r.country_name)} · ${
          formatEntityLabel(r.category).split(' ')[0]
        }`,
        fullMarket: `${formatEntityLabel(r.country_name)} · ${formatEntityLabel(
          r.category
        )}`,
        segmentName: r.Cluster_Name || 'Market Segment',
        growthSlope: Number(r.search_interest_trend_slope.toFixed(2)),
        searchInterest: Number(r.mean_search_interest.toFixed(1)),
      })),
    [topMomentum4W]
  );

  // Prepare visual chart data for Market Segment Distribution (by Segment Name)
  const segmentDistributionChartData = useMemo(() => {
    const sourceRows =
      reportHorizon === 'overall' ? overallClusters : fourWeekClusters;
    const map = new Map<
      string,
      { segmentName: string; marketCount: number; avgSearch: number }
    >();

    for (const row of sourceRows) {
      const segId = row.Cluster_Label ?? -1;
      const segName =
        activeDashboardReport?.clusterMap[segId]?.clusterName ||
        row.Cluster_Name ||
        'Unassigned';
      const existing = map.get(segName);
      if (!existing) {
        map.set(segName, {
          segmentName: segName,
          marketCount: 1,
          avgSearch: row.mean_search_interest,
        });
      } else {
        const nextCount = existing.marketCount + 1;
        existing.avgSearch =
          (existing.avgSearch * existing.marketCount +
            row.mean_search_interest) /
          nextCount;
        existing.marketCount = nextCount;
      }
    }

    if (map.size === 0 && activeDashboardReport) {
      for (const seg of activeDashboardReport.clusters) {
        map.set(seg.clusterName, {
          segmentName: seg.clusterName,
          marketCount: seg.marketCount,
          avgSearch: 0,
        });
      }
    }

    return Array.from(map.values()).map((item) => ({
      ...item,
      avgSearch: Number(item.avgSearch.toFixed(1)),
    }));
  }, [
    reportHorizon,
    overallClusters,
    fourWeekClusters,
    activeDashboardReport,
  ]);

  const topFastestMarket = topMomentum4W[0];
  const topUnderservedMarket = topUntappedOverall[0];

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
      {/* Atmospheric Executive Command Banner */}
      <div className="bg-aura-banner text-white rounded-2xl p-6 lg:p-8 border border-slate-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-300 font-medium">
            <span>DemandAura Intelligence Workspace</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-slate-300">
              42 Global Markets (14 Countries × 3 Categories)
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            {healthLoading ? (
              <span className="text-amber-300">
                Waking up intelligence service...
              </span>
            ) : healthError ? (
              <span className="text-rose-300">
                Service reconnecting — click Refresh
              </span>
            ) : health?.status === 'healthy' ? (
              <span className="text-emerald-300 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                All 42 Markets Online
              </span>
            ) : (
              <span className="text-slate-400">Syncing market signals...</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {user
              ? `Welcome back, ${
                  profile?.displayName || user.displayName || 'Market Planner'
                }`
              : 'Market Foresight Command Center'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Real-time consumer demand vs. media hype signals, 4-week search
            interest trajectories, and dynamic weekly market segment reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onRefreshHealth}
            disabled={healthLoading}
            className="px-4 py-2.5 text-xs font-medium text-slate-200 bg-slate-900/80 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-cyan-400 ${
                healthLoading ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh Market Data</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('divergence')}
            className="px-4 py-2.5 text-xs font-semibold text-white btn-aura-primary rounded-xl cursor-pointer whitespace-nowrap"
          >
            + Check Demand vs. Hype Score
          </button>
        </div>
      </div>

      {/* Color-Coded Executive KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-aura rounded-2xl p-5 relative overflow-hidden space-y-1.5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-cyan-500" />
          <div className="flex items-center justify-between text-xs font-semibold text-teal-700">
            <span>Global Markets Tracked</span>
            <Globe className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-tabular">
            42 Markets
          </div>
          <div className="text-xs text-slate-500">
            14 Countries × 3 Lifestyle Categories
          </div>
        </div>

        <div className="card-aura rounded-2xl p-5 relative overflow-hidden space-y-1.5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Fastest-Rising Market (4W)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {topFastestMarket
              ? `${formatEntityLabel(
                  topFastestMarket.country_name
                )} · ${formatEntityLabel(topFastestMarket.category)}`
              : 'Loading...'}
          </div>
          <div className="text-xs text-emerald-700 font-mono-tabular font-semibold">
            {topFastestMarket
              ? `+${topFastestMarket.search_interest_trend_slope.toFixed(
                  2
                )} weekly growth · ${
                  topFastestMarket.Cluster_Name || 'Momentum Leader'
                }`
              : 'Calculating 4-week momentum...'}
          </div>
        </div>

        <div className="card-aura rounded-2xl p-5 relative overflow-hidden space-y-1.5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-600" />
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-700">
            <span>Top Underserved Demand (3Y+)</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {topUnderservedMarket
              ? `${formatEntityLabel(
                  topUnderservedMarket.country_name
                )} · ${formatEntityLabel(topUnderservedMarket.category)}`
              : 'Loading...'}
          </div>
          <div className="text-xs text-indigo-700 font-mono-tabular font-medium">
            {topUnderservedMarket
              ? `Demand-to-Media Ratio: ${topUnderservedMarket.mean_demand_to_hype_ratio.toFixed(
                  2
                )}`
              : 'Calculating demand ratio...'}
          </div>
        </div>

        <div className="card-aura rounded-2xl p-5 relative overflow-hidden space-y-1.5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-600" />
          <div className="flex items-center justify-between text-xs font-semibold text-purple-700">
            <span>Saved Workspace Analyses</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-tabular">
            {predictions.length}
          </div>
          <div className="text-xs text-slate-500">
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-purple-700 font-medium underline hover:text-purple-900 cursor-pointer"
            >
              View saved predictions &amp; notes
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Multi-Colored Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual 1: Fastest-Rising 4-Week Markets Bar Chart */}
        <div className="card-aura rounded-2xl p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-600" />
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-teal-700">
                4-Week Momentum Visual · Demand Growth Velocity
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Fastest-Accelerating Consumer Markets (Last 4 Weeks)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('segmentation')}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Explore Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {clustersLoading || risingMarketsChartData.length === 0 ? (
            <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={risingMarketsChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 24, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="risingBarGrad"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#0D9488" />
                      <stop offset="50%" stopColor="#0284C7" />
                      <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#475569' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="marketLabel"
                    width={140}
                    tick={{ fontSize: 11, fill: '#0F172A', fontWeight: 500 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload as {
                        fullMarket: string;
                        segmentName: string;
                        growthSlope: number;
                        searchInterest: number;
                      };
                      return (
                        <div className="bg-[#081229] text-white p-3.5 rounded-xl text-xs space-y-1 shadow-xl border border-cyan-500/30">
                          <div className="font-semibold text-cyan-300">
                            {item.fullMarket}
                          </div>
                          <div className="text-slate-300 font-medium">
                            {item.segmentName}
                          </div>
                          <div className="font-mono-tabular pt-1 border-t border-slate-800 space-y-0.5">
                            <div className="text-emerald-400">
                              4-Week Growth: +{item.growthSlope}
                            </div>
                            <div>Avg Search Interest: {item.searchInterest}</div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="growthSlope"
                    name="4-Week Demand Growth"
                    fill="url(#risingBarGrad)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Visual 2: Market Segment Distribution Chart (Multi-Colored by Segment Name) */}
        <div className="card-aura rounded-2xl p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-indigo-700">
                Global Market Structure · Markets per Segment Name
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {reportHorizon === '4w'
                  ? '4-Week Market Segments Breakdown (42 Markets)'
                  : '3+ Year Long-Term Market Segments (42 Markets)'}
              </h3>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setReportHorizon('4w')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  reportHorizon === '4w'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4 Weeks
              </button>
              <button
                type="button"
                onClick={() => setReportHorizon('overall')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  reportHorizon === 'overall'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3+ Years
              </button>
            </div>
          </div>

          {clustersLoading || segmentDistributionChartData.length === 0 ? (
            <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={segmentDistributionChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 24, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#475569' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="segmentName"
                    width={170}
                    tick={{ fontSize: 11, fill: '#0F172A', fontWeight: 500 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload as {
                        segmentName: string;
                        marketCount: number;
                        avgSearch: number;
                      };
                      return (
                        <div className="bg-[#081229] text-white p-3.5 rounded-xl text-xs space-y-1 shadow-xl border border-indigo-500/30">
                          <div className="font-semibold text-indigo-300">
                            {item.segmentName}
                          </div>
                          <div className="font-mono-tabular pt-1 border-t border-slate-800 space-y-0.5">
                            <div>Markets Assigned: {item.marketCount}</div>
                            <div>Avg Search Interest: {item.avgSearch}</div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="marketCount"
                    name="Markets in Segment"
                    radius={[0, 6, 6, 0]}
                  >
                    {segmentDistributionChartData.map((entry, idx) => (
                      <Cell
                        key={entry.segmentName}
                        fill={SEGMENT_COLORS[idx % SEGMENT_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Live Market Intelligence Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 4-Week Momentum Markets */}
        <div className="card-aura rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-50/60 via-cyan-50/30 to-transparent flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Fastest-Rising Markets (Last 4 Weeks)
              </h3>
              <p className="text-xs text-slate-600">
                Markets with the strongest recent growth in consumer search
                interest
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('segmentation')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline cursor-pointer"
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
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/80">
                    <th className="py-3 px-4 font-semibold">Market</th>
                    <th className="py-3 px-4 font-semibold">
                      4-Week Momentum Segment
                    </th>
                    <th className="py-3 px-4 font-semibold text-right">
                      Search Interest
                    </th>
                    <th className="py-3 px-4 font-semibold text-right">
                      4-Week Growth
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topMomentum4W.map((row) => (
                    <tr
                      key={`${row.country_name}-${row.category}`}
                      className="hover:bg-cyan-50/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {formatEntityLabel(row.country_name)} ·{' '}
                        <span className="text-slate-600 font-normal">
                          {formatEntityLabel(row.category)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-teal-800 font-medium">
                        {row.Cluster_Name || 'Momentum Segment'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular text-slate-800">
                        {row.mean_search_interest.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular text-emerald-700 font-bold">
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
        <div className="card-aura rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50/60 via-violet-50/30 to-transparent flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Strongest Underserved Demand (3+ Year History)
              </h3>
              <p className="text-xs text-slate-600">
                Markets where shopper search interest consistently outpaces
                media coverage
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('segmentation')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
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
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/80">
                    <th className="py-3 px-4 font-semibold">Market</th>
                    <th className="py-3 px-4 font-semibold">
                      3+ Year Market Segment
                    </th>
                    <th className="py-3 px-4 font-semibold text-right">
                      Media Mentions
                    </th>
                    <th className="py-3 px-4 font-semibold text-right">
                      Demand-to-Media Ratio
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topUntappedOverall.map((row) => (
                    <tr
                      key={`${row.country_name}-${row.category}`}
                      className="hover:bg-indigo-50/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {formatEntityLabel(row.country_name)} ·{' '}
                        <span className="text-slate-600 font-normal">
                          {formatEntityLabel(row.category)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-indigo-800 font-medium">
                        {row.Cluster_Name || 'Strategic Segment'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular text-slate-800">
                        {row.mean_media_volume.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular text-indigo-700 font-bold">
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

      {/* Dynamic Weekly Market Segment Report Highlights */}
      <div className="card-aura rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>
                Weekly Market Segment Intelligence · Updated Every Week
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Weekly Market Segment Report (
              {activeDashboardReport
                ? `${activeDashboardReport.clusters.length} Discovered Segments`
                : 'Loading Report...'}
              )
            </h2>
            <p className="text-xs text-slate-600">
              Both the market segments and the executive reports are updated
              every week—highlighting each market segment&apos;s key insights,
              business use case, and core commercial question answered.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setReportHorizon('4w')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  reportHorizon === '4w'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 4 Weeks Report
              </button>
              <button
                type="button"
                onClick={() => setReportHorizon('overall')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  reportHorizon === 'overall'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3+ Year Report
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('segmentation')}
              className="px-4 py-2 text-xs font-semibold text-white btn-aura-primary rounded-xl cursor-pointer whitespace-nowrap"
            >
              Open Full Segment Report
            </button>
          </div>
        </div>

        {reportsLoading && !activeDashboardReport ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-36 bg-slate-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : activeDashboardReport ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeDashboardReport.clusters.map((segment, idx) => {
              const style =
                SEGMENT_CARD_STYLES[idx % SEGMENT_CARD_STYLES.length];
              return (
                <div
                  key={segment.clusterLabel}
                  className={`rounded-xl border p-5 flex flex-col justify-between space-y-3 relative overflow-hidden ${style.bg}`}
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${style.topBar}`}
                  />
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {segment.clusterName}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-mono-tabular font-semibold shrink-0 ${style.badge}`}
                      >
                        {segment.marketCount}{' '}
                        {segment.marketCount === 1 ? 'market' : 'markets'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {segment.keyInsightsSummary}
                    </p>
                    {segment.businessUseCase && (
                      <div className="pt-1 text-xs text-slate-800 leading-relaxed">
                        <strong className="text-slate-950">Use Case:</strong>{' '}
                        {segment.businessUseCase}
                      </div>
                    )}
                  </div>

                  {segment.coreBusinessQuestion && (
                    <div className="pt-2.5 border-t border-slate-200/80 text-xs text-slate-700 italic font-medium">
                      &ldquo;{segment.coreBusinessQuestion}&rdquo;
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            Loading weekly market segment report...
          </div>
        )}
      </div>

      {/* Recent User Prediction & Query History Preview */}
      <div className="card-aura rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
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
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
          >
            Open Full History
          </button>
        </div>

        {predictions.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="text-sm font-semibold text-slate-900">
              No market analyses recorded yet
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Check a Demand vs. Hype Divergence Score or run a 4-Week Search
              Interest Forecast to automatically save your market findings here.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('divergence')}
              className="px-4 py-2.5 text-xs font-semibold text-white btn-aura-primary rounded-xl cursor-pointer"
            >
              Check Demand vs. Hype Score
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/80">
                  <th className="py-3 px-4 font-semibold">Date &amp; Time</th>
                  <th className="py-3 px-4 font-semibold">Analysis Tool</th>
                  <th className="py-3 px-4 font-semibold">Market Selected</th>
                  <th className="py-3 px-4 font-semibold">Result Summary</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {predictions.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono-tabular text-slate-500">
                      {new Date(item.createdAtIso).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.modelDisplayName}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {formatEntityLabel(item.countryName)} ·{' '}
                      {formatEntityLabel(item.category)}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular font-semibold text-indigo-900">
                      {item.summaryValue}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular">
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
