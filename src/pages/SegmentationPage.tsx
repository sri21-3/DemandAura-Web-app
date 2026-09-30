import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import {
  PipelineErrorState,
  PipelineFlowStatus,
} from '../components/PipelineFlowStatus';
import {
  API_ENDPOINTS,
  formatEntityLabel,
  VALID_CATEGORIES,
  VALID_COUNTRIES,
} from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  COLD_START_THRESHOLD_MS,
  MlPipelineError,
  nexusDemandApi,
  validateOptionalSegmentationFilter,
} from '../services/nexusDemandApi';
import {
  CanonicalCategory,
  CanonicalCountry,
  MarkdownReportResponse,
  PipelineExecutionMeta,
  SegmentationRecord,
} from '../types/models';

interface SegmentationPageProps {
  overallClusters: SegmentationRecord[];
  fourWeekClusters: SegmentationRecord[];
  clustersLoading: boolean;
}

export const SegmentationPage: React.FC<SegmentationPageProps> = ({
  overallClusters,
  fourWeekClusters,
  clustersLoading,
}) => {
  const { logPrediction } = useAuth();

  const [mode, setMode] = useState<'overall' | '4w'>('overall');
  const [countryFilter, setCountryFilter] = useState<CanonicalCountry | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<CanonicalCategory | ''>(
    ''
  );
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'table' | 'report'>('table');

  const [queriedOverall, setQueriedOverall] = useState<
    SegmentationRecord[] | null
  >(null);
  const [queried4W, setQueried4W] = useState<SegmentationRecord[] | null>(null);

  const [queryLoading, setQueryLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [queryError, setQueryError] = useState<PipelineErrorState | null>(null);
  const [pipelineMeta, setPipelineMeta] =
    useState<PipelineExecutionMeta | null>(null);

  const [overallReport, setOverallReport] =
    useState<MarkdownReportResponse | null>(null);
  const [fourWeekReport, setFourWeekReport] =
    useState<MarkdownReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    async function loadReports() {
      setReportLoading(true);
      setReportError(null);
      try {
        const [repOverall, rep4W] = await Promise.all([
          nexusDemandApi.getMarketSegmentationReport(),
          nexusDemandApi.get4WeeksSegmentationReport(),
        ]);
        setOverallReport(repOverall);
        setFourWeekReport(rep4W);
      } catch (err: unknown) {
        setReportError(
          err instanceof Error
            ? err.message
            : 'Failed loading executive market briefings.'
        );
      } finally {
        setReportLoading(false);
      }
    }
    loadReports();
  }, []);

  const baseDataset = mode === 'overall' ? overallClusters : fourWeekClusters;
  const activeDataset =
    mode === 'overall'
      ? queriedOverall ?? overallClusters
      : queried4W ?? fourWeekClusters;
  const activeReport = mode === 'overall' ? overallReport : fourWeekReport;

  const handleExecuteSegmentationQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (queryLoading) return;

    setQueryLoading(true);
    setElapsedMs(0);
    setQueryError(null);

    const endpoint =
      mode === 'overall'
        ? API_ENDPOINTS.CLUSTERS_MARKET_SEGMENTATION
        : API_ENDPOINTS.CLUSTERS_4W_SEGMENTATION;

    const startTs = performance.now();
    timerRef.current = window.setInterval(() => {
      setElapsedMs(Math.round(performance.now() - startTs));
    }, 200);

    try {
      const validatedFilter = validateOptionalSegmentationFilter(
        {
          country_name: countryFilter,
          category: categoryFilter,
        },
        endpoint
      );

      const res =
        mode === 'overall'
          ? await nexusDemandApi.getMarketSegmentation(
              validatedFilter,
              (meta) => setPipelineMeta(meta)
            )
          : await nexusDemandApi.get4WeeksSegmentation(
              validatedFilter,
              (meta) => setPipelineMeta(meta)
            );

      if (mode === 'overall') {
        setQueriedOverall(res.data);
      } else {
        setQueried4W(res.data);
      }

      const sample = res.data[0];
      await logPrediction({
        modelType:
          mode === 'overall' ? 'segmentation_overall' : 'segmentation_4w',
        modelDisplayName:
          mode === 'overall'
            ? 'Long-Term Market Segmentation (3+ Years)'
            : 'Recent 4-Week Market Momentum Segmentation',
        countryName: validatedFilter.country_name || 'All_14_Countries',
        category: validatedFilter.category || 'All_3_Categories',
        summaryValue: sample
          ? `${res.total_records} markets (${
              sample.Cluster_Name || `Segment ${sample.Cluster_Label}`
            })`
          : `${res.total_records} markets matched`,
        numericResult: res.total_records,
        recordDate:
          mode === 'overall' ? '3+ Year History' : 'Recent 4-Week Window',
        predictionStatus: 'success',
        notes: `Segment filter: ${clusterFilter}`,
      });
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error
          ? err.message
          : 'Failed to update market segmentation view.';

      if (err instanceof MlPipelineError) {
        setQueryError({
          category: err.category,
          message: err.message,
          statusCode: err.statusCode,
          endpoint: err.endpoint,
        });
      } else {
        setQueryError({
          category: 'backend_error',
          message: errMessage,
          endpoint,
        });
      }

      try {
        await logPrediction({
          modelType:
            mode === 'overall' ? 'segmentation_overall' : 'segmentation_4w',
          modelDisplayName:
            mode === 'overall'
              ? 'Long-Term Market Segmentation (3+ Years)'
              : 'Recent 4-Week Market Momentum Segmentation',
          countryName: countryFilter || 'All_14_Countries',
          category: categoryFilter || 'All_3_Categories',
          summaryValue: `Error: ${errMessage.slice(0, 140)}`,
          numericResult: 0,
          recordDate:
            mode === 'overall' ? '3+ Year History' : 'Recent 4-Week Window',
          predictionStatus: 'error',
          notes: `Segment filter: ${clusterFilter}`,
        });
      } catch {
        // Non-blocking audit log on failure
      }
    } finally {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setQueryLoading(false);
    }
  };

  const clusterGroups = useMemo(() => {
    const map = new Map<
      number,
      {
        label: number;
        name: string;
        count: number;
        avgInterest: number;
        avgMedia: number;
        avgSlope: number;
        avgSentiment: number;
      }
    >();

    baseDataset.forEach((row) => {
      const id = row.Cluster_Label ?? -1;
      const existing = map.get(id);
      if (!existing) {
        map.set(id, {
          label: id,
          name: row.Cluster_Name || `Market Group ${id}`,
          count: 1,
          avgInterest: row.mean_search_interest,
          avgMedia: row.mean_media_volume,
          avgSlope: row.search_interest_trend_slope,
          avgSentiment: row.mean_net_sentiment,
        });
      } else {
        const nextCount = existing.count + 1;
        existing.avgInterest =
          (existing.avgInterest * existing.count + row.mean_search_interest) /
          nextCount;
        existing.avgMedia =
          (existing.avgMedia * existing.count + row.mean_media_volume) /
          nextCount;
        existing.avgSlope =
          (existing.avgSlope * existing.count +
            row.search_interest_trend_slope) /
          nextCount;
        existing.avgSentiment =
          (existing.avgSentiment * existing.count + row.mean_net_sentiment) /
          nextCount;
        existing.count = nextCount;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.label - b.label);
  }, [baseDataset]);

  const filteredRows = useMemo(() => {
    return activeDataset.filter((row) => {
      if (
        countryFilter &&
        row.country_name.toLowerCase() !== countryFilter.toLowerCase()
      ) {
        return false;
      }
      if (
        categoryFilter &&
        row.category.toLowerCase() !== categoryFilter.toLowerCase()
      ) {
        return false;
      }
      if (
        clusterFilter !== 'all' &&
        String(row.Cluster_Label) !== clusterFilter
      ) {
        return false;
      }
      return true;
    });
  }, [activeDataset, countryFilter, categoryFilter, clusterFilter]);

  const handleExportCsv = () => {
    if (filteredRows.length === 0) return;
    const headers = [
      'country_name',
      'category',
      'mean_search_interest',
      'mean_media_volume',
      'mean_demand_to_hype_ratio',
      'search_interest_trend_slope',
      'mean_net_sentiment',
      'mean_gdp_per_capita',
      'Cluster_Label',
      'Cluster_Name',
    ];
    const csvLines = [
      headers.join(','),
      ...filteredRows.map((r) =>
        [
          r.country_name,
          r.category,
          r.mean_search_interest,
          r.mean_media_volume,
          r.mean_demand_to_hype_ratio,
          r.search_interest_trend_slope,
          r.mean_net_sentiment,
          r.mean_gdp_per_capita,
          r.Cluster_Label ?? '',
          `"${(r.Cluster_Name || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([csvLines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `demandaura_${mode}_market_segments.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isProcessing = clustersLoading || queryLoading;

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-8">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Global Market Segmentation</span>
            <span aria-hidden="true">·</span>
            <span>
              {mode === 'overall'
                ? 'Long-Term Multi-Year Market Structure (Updated Weekly)'
                : 'Most Recent 4 Weeks of Market Momentum (Updated Weekly)'}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Global Market Segmentation &amp; Executive Briefings
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            Compare how all 42 country–category markets group together across{' '}
            <strong>multi-year long-term history</strong> versus the{' '}
            <strong>most recent 4 weeks</strong>. Because market data refreshes
            every week, segments adapt automatically to help you plan long-term
            expansion and catch sudden short-term demand shifts early.
          </p>
        </div>

        {/* Segmented Horizon Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => {
              setMode('overall');
              setClusterFilter('all');
            }}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 ${
              mode === 'overall'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Long-Term Market Structure (3+ Years)
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => {
              setMode('4w');
              setClusterFilter('all');
            }}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 ${
              mode === '4w'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 4 Weeks Momentum
          </button>
        </div>
      </div>

      {/* Status & Alert Bar */}
      <PipelineFlowStatus
        loading={isProcessing}
        elapsedMs={elapsedMs}
        isColdStart={elapsedMs >= COLD_START_THRESHOLD_MS}
        error={queryError}
        meta={pipelineMeta}
        onRetry={() => handleExecuteSegmentationQuery()}
        modelLabel={
          mode === 'overall'
            ? '3+ Year Market Segmentation'
            : '4-Week Momentum Segmentation'
        }
      />

      {/* Segment Summary Cards */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-900">
          {mode === 'overall'
            ? `Active Long-Term Market Groups (${clusterGroups.length} Discovered · Click a group to filter markets)`
            : `Active 4-Week Momentum Profiles (${clusterGroups.length} Discovered · Click a profile to filter markets)`}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {clusterGroups.map((cg) => {
            const selected = clusterFilter === String(cg.label);
            return (
              <button
                key={cg.label}
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  setClusterFilter(selected ? 'all' : String(cg.label))
                }
                className={`text-left p-4 rounded-xl border transition-colors cursor-pointer space-y-2 disabled:opacity-60 ${
                  selected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono-tabular">
                  <span
                    className={selected ? 'text-slate-300' : 'text-slate-500'}
                  >
                    Group {cg.label}
                  </span>
                  <span
                    className={selected ? 'text-slate-300' : 'text-slate-500'}
                  >
                    {cg.count} {cg.count === 1 ? 'market' : 'markets'}
                  </span>
                </div>
                <div className="text-sm font-semibold leading-snug">
                  {cg.name}
                </div>
                <div
                  className={`pt-1 grid grid-cols-2 gap-2 text-xs font-mono-tabular ${
                    selected ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  <div>Search Index: {cg.avgInterest.toFixed(1)}</div>
                  <div>
                    Trend: {cg.avgSlope >= 0 ? '+' : ''}
                    {cg.avgSlope.toFixed(2)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Refresh Controls */}
      <form
        onSubmit={handleExecuteSegmentationQuery}
        className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        noValidate
      >
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={countryFilter}
            disabled={isProcessing}
            onChange={(e) =>
              setCountryFilter(e.target.value as CanonicalCountry | '')
            }
            aria-label="Filter by Target Country"
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-50"
          >
            <option value="">All 14 Countries</option>
            {VALID_COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            disabled={isProcessing}
            onChange={(e) =>
              setCategoryFilter(e.target.value as CanonicalCategory | '')
            }
            aria-label="Filter by Consumer Category"
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-50"
          >
            <option value="">All 3 Categories</option>
            {VALID_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={clusterFilter}
            disabled={isProcessing}
            onChange={(e) => setClusterFilter(e.target.value)}
            aria-label="Filter by Market Segment"
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-50"
          >
            <option value="all">All Market Groups</option>
            {clusterGroups.map((cg) => (
              <option key={cg.label} value={String(cg.label)}>
                Group {cg.label}: {cg.name}
              </option>
            ))}
          </select>

          {(countryFilter ||
            categoryFilter ||
            clusterFilter !== 'all' ||
            queriedOverall ||
            queried4W) && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                setCountryFilter('');
                setCategoryFilter('');
                setClusterFilter('all');
                setQueriedOverall(null);
                setQueried4W(null);
              }}
              className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer disabled:opacity-50"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={isProcessing}
            aria-busy={isProcessing}
            className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {queryLoading
              ? `Updating Market View (${(elapsedMs / 1000).toFixed(1)}s)...`
              : 'Update Market View'}
          </button>

          <button
            type="button"
            disabled={isProcessing || filteredRows.length === 0}
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Market Map &amp; Table ({filteredRows.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'report'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Executive Briefing
            </button>
          </div>
        </div>
      </form>

      {activeTab === 'table' ? (
        <div className="space-y-8">
          {/* Scatter Visualization */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Market Positioning Map: Search Popularity vs. Demand Growth
                </h2>
                <p className="text-xs text-slate-500">
                  Each point represents a country–category market in the{' '}
                  {mode === 'overall'
                    ? '3+ Year Long-Term Segmentation'
                    : 'Recent 4-Week Momentum Segmentation'}
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    dataKey="mean_search_interest"
                    name="Average Search Interest"
                    tick={{ fontSize: 12, fill: '#475569' }}
                    label={{
                      value: 'Average Search Interest (0–100)',
                      position: 'insideBottom',
                      offset: -5,
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="search_interest_trend_slope"
                    name="Demand Growth Direction"
                    tick={{ fontSize: 12, fill: '#475569' }}
                  />
                  <ZAxis
                    type="number"
                    dataKey="mean_demand_to_hype_ratio"
                    range={[60, 260]}
                    name="Demand-to-Media Balance"
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const rec = payload[0].payload as SegmentationRecord;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs space-y-1 shadow-lg">
                          <div className="font-semibold">
                            {formatEntityLabel(rec.country_name)} ·{' '}
                            {formatEntityLabel(rec.category)}
                          </div>
                          <div className="text-slate-300">
                            {rec.Cluster_Name || `Group ${rec.Cluster_Label}`}
                          </div>
                          <div className="font-mono-tabular pt-1 space-y-0.5">
                            <div>
                              Search Interest:{' '}
                              {rec.mean_search_interest.toFixed(2)}
                            </div>
                            <div>
                              Demand Growth:{' '}
                              {rec.search_interest_trend_slope.toFixed(3)}
                            </div>
                            <div>
                              Demand-to-Media Ratio:{' '}
                              {rec.mean_demand_to_hype_ratio.toFixed(2)}
                            </div>
                            <div>
                              Weekly Media Mentions:{' '}
                              {rec.mean_media_volume.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter
                    name="Markets"
                    data={filteredRows}
                    fill="#0F172A"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 42-Market Profile Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Market Comparison Table ({filteredRows.length} of{' '}
                {baseDataset.length} markets)
              </h3>
              <span className="text-xs text-slate-500">
                {mode === 'overall'
                  ? '3+ Year Historical Averages'
                  : 'Most Recent 4-Week Averages'}
              </span>
            </div>

            {isProcessing ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-9 bg-slate-100 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-3 px-4 font-medium">Country</th>
                      <th className="py-3 px-4 font-medium">Category</th>
                      <th className="py-3 px-4 font-medium">
                        Assigned Market Group
                      </th>
                      <th className="py-3 px-4 font-medium text-right">
                        Avg Search Interest
                      </th>
                      <th className="py-3 px-4 font-medium text-right">
                        Weekly Media Mentions
                      </th>
                      <th className="py-3 px-4 font-medium text-right">
                        Demand-to-Media Ratio
                      </th>
                      <th className="py-3 px-4 font-medium text-right">
                        Demand Trend
                      </th>
                      <th className="py-3 px-4 font-medium text-right">
                        Media Sentiment
                      </th>
                      <th className="py-3 px-4 font-medium text-right">
                        Purchasing Power (USD)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((row) => (
                      <tr
                        key={`${row.country_name}-${row.category}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="py-2.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                          {formatEntityLabel(row.country_name)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                          {formatEntityLabel(row.category)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-800 whitespace-nowrap">
                          <span className="font-mono-tabular text-slate-400 mr-1.5">
                            #{row.Cluster_Label ?? '-'}
                          </span>
                          <span className="font-medium">
                            {row.Cluster_Name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-900">
                          {row.mean_search_interest.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-700">
                          {row.mean_media_volume.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-900 font-semibold">
                          {row.mean_demand_to_hype_ratio.toFixed(2)}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-mono-tabular font-medium ${
                            row.search_interest_trend_slope >= 0
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {row.search_interest_trend_slope >= 0 ? '+' : ''}
                          {row.search_interest_trend_slope.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-700">
                          {row.mean_net_sentiment.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-700">
                          $
                          {row.mean_gdp_per_capita.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Executive Briefing Tab */
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <div className="text-xs text-slate-500">
                Strategic Executive Briefing
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                {mode === 'overall'
                  ? '3+ Year Long-Term Market Segmentation Report'
                  : 'Recent 4-Week Market Momentum Report'}
              </h2>
            </div>
          </div>

          {reportLoading ? (
            <div className="space-y-3">
              <div className="h-6 w-64 bg-slate-100 rounded animate-pulse" />
              <div className="h-40 w-full bg-slate-100 rounded animate-pulse" />
            </div>
          ) : reportError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {reportError}
            </div>
          ) : activeReport ? (
            <div className="prose prose-slate max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-200 overflow-x-auto">
                {activeReport.content}
              </pre>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              No executive briefing loaded.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
