import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, RefreshCw } from 'lucide-react';
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

      {/* Service & Market Coverage Status Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

      {/* Executive KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="text-xs text-slate-500">Global Markets Tracked</div>
          <div className="text-2xl font-semibold text-slate-900 font-mono-tabular">
            42 Markets
          </div>
          <div className="text-xs text-slate-500">
            14 Countries × 3 Lifestyle Categories
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="text-xs text-slate-500">
            Fastest-Rising Market (4W)
          </div>
          <div className="text-base font-semibold text-slate-900 truncate">
            {topFastestMarket
              ? `${formatEntityLabel(
                  topFastestMarket.country_name
                )} · ${formatEntityLabel(topFastestMarket.category)}`
              : 'Loading...'}
          </div>
          <div className="text-xs text-emerald-700 font-mono-tabular font-medium">
            {topFastestMarket
              ? `+${topFastestMarket.search_interest_trend_slope.toFixed(
                  2
                )} weekly growth · ${
                  topFastestMarket.Cluster_Name || 'Momentum Leader'
                }`
              : 'Calculating 4-week momentum...'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="text-xs text-slate-500">
            Top Underserved Demand (3Y+)
          </div>
          <div className="text-base font-semibold text-slate-900 truncate">
            {topUnderservedMarket
              ? `${formatEntityLabel(
                  topUnderservedMarket.country_name
                )} · ${formatEntityLabel(topUnderservedMarket.category)}`
              : 'Loading...'}
          </div>
          <div className="text-xs text-slate-600 font-mono-tabular">
            {topUnderservedMarket
              ? `Demand-to-Media Ratio: ${topUnderservedMarket.mean_demand_to_hype_ratio.toFixed(
                  2
                )}`
              : 'Calculating demand ratio...'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="text-xs text-slate-500">Saved Workspace Analyses</div>
          <div className="text-2xl font-semibold text-slate-900 font-mono-tabular">
            {predictions.length}
          </div>
          <div className="text-xs text-slate-500">
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="underline hover:text-slate-900 cursor-pointer"
            >
              View saved predictions &amp; notes
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual 1: Fastest-Rising 4-Week Markets Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs text-slate-500">
                4-Week Momentum Visual · Demand Growth Slope
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Fastest-Accelerating Consumer Markets (Last 4 Weeks)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('segmentation')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 underline cursor-pointer whitespace-nowrap"
            >
              Explore Map
            </button>
          </div>

          {clustersLoading || risingMarketsChartData.length === 0 ? (
            <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={risingMarketsChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#475569' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="marketLabel"
                    width={135}
                    tick={{ fontSize: 11, fill: '#0F172A' }}
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
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs space-y-1 shadow-lg">
                          <div className="font-semibold">{item.fullMarket}</div>
                          <div className="text-slate-300">
                            {item.segmentName}
                          </div>
                          <div className="font-mono-tabular pt-1 space-y-0.5">
                            <div>4-Week Growth: +{item.growthSlope}</div>
                            <div>Avg Search Interest: {item.searchInterest}</div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="growthSlope"
                    name="4-Week Demand Growth"
                    fill="#0F172A"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Visual 2: Market Segment Distribution Chart (by Segment Name) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs text-slate-500">
                Global Market Structure · Markets per Segment Name
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                {reportHorizon === '4w'
                  ? '4-Week Market Segments Breakdown (42 Markets)'
                  : '3+ Year Long-Term Market Segments (42 Markets)'}
              </h3>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setReportHorizon('4w')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  reportHorizon === '4w'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4 Weeks
              </button>
              <button
                type="button"
                onClick={() => setReportHorizon('overall')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  reportHorizon === 'overall'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3+ Years
              </button>
            </div>
          </div>

          {clustersLoading || segmentDistributionChartData.length === 0 ? (
            <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={segmentDistributionChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#475569' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="segmentName"
                    width={165}
                    tick={{ fontSize: 11, fill: '#0F172A' }}
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
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs space-y-1 shadow-lg">
                          <div className="font-semibold">{item.segmentName}</div>
                          <div className="font-mono-tabular pt-1 space-y-0.5">
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
                    fill="#334155"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Live Market Intelligence Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      4-Week Momentum Segment
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
                      <td className="py-2.5 px-4 text-slate-700 font-medium">
                        {row.Cluster_Name || 'Momentum Segment'}
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
                      3+ Year Market Segment
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
                      <td className="py-2.5 px-4 text-slate-700 font-medium">
                        {row.Cluster_Name || 'Strategic Segment'}
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

      {/* Dynamic Weekly Market Segment Report Highlights */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">
              Live Weekly Backend Report · Updated Automatically Every Week
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              Weekly Market Segment Report (
              {activeDashboardReport
                ? `${activeDashboardReport.clusters.length} Discovered Segments`
                : 'Loading Report...'}
              )
            </h2>
            <p className="text-xs text-slate-500">
              Directly parsed from the weekly backend reports—highlighting each
              market segment&apos;s key insights, business use case, and core
              commercial question answered.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setReportHorizon('4w')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  reportHorizon === '4w'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 4 Weeks Report
              </button>
              <button
                type="button"
                onClick={() => setReportHorizon('overall')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  reportHorizon === 'overall'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3+ Year Report
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('segmentation')}
              className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Open Full Segment Report
            </button>
          </div>
        </div>

        {reportsLoading && !activeDashboardReport ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-36 bg-slate-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : activeDashboardReport ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDashboardReport.clusters.map((segment) => (
              <div
                key={segment.clusterLabel}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {segment.clusterName}
                    </h3>
                    <span className="text-xs text-slate-500 font-mono-tabular shrink-0">
                      {segment.marketCount}{' '}
                      {segment.marketCount === 1 ? 'market' : 'markets'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {segment.keyInsightsSummary}
                  </p>
                  {segment.businessUseCase && (
                    <div className="pt-1 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900">Use Case:</strong>{' '}
                      {segment.businessUseCase}
                    </div>
                  )}
                </div>

                {segment.coreBusinessQuestion && (
                  <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600 italic">
                    &ldquo;{segment.coreBusinessQuestion}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            Weekly segment report is syncing from backend...
          </div>
        )}
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
