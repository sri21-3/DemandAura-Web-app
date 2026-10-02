import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { Download, FileText, RefreshCw } from 'lucide-react';
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
import { parseSegmentationReport } from '../utils/reportParser';

interface SegmentationPageProps {
  overallClusters: SegmentationRecord[];
  fourWeekClusters: SegmentationRecord[];
  clustersLoading: boolean;
  overallReport?: MarkdownReportResponse | null;
  fourWeekReport?: MarkdownReportResponse | null;
  reportsLoading?: boolean;
  reportsError?: string | null;
  onRefreshAll?: () => Promise<void>;
}

export const SegmentationPage: React.FC<SegmentationPageProps> = ({
  overallClusters,
  fourWeekClusters,
  clustersLoading,
  overallReport: propOverallReport = null,
  fourWeekReport: propFourWeekReport = null,
  reportsLoading: propReportsLoading = false,
  reportsError: propReportsError = null,
  onRefreshAll,
}) => {
  const { logPrediction } = useAuth();

  const [mode, setMode] = useState<'overall' | '4w'>('overall');
  const [countryFilter, setCountryFilter] = useState<CanonicalCountry | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<CanonicalCategory | ''>(
    ''
  );
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'table' | 'report'>('table');
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  const [queriedOverall, setQueriedOverall] = useState<
    SegmentationRecord[] | null
  >(null);
  const [queried4W, setQueried4W] = useState<SegmentationRecord[] | null>(null);

  const [queryLoading, setQueryLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [queryError, setQueryError] = useState<PipelineErrorState | null>(null);
  const [pipelineMeta, setPipelineMeta] =
    useState<PipelineExecutionMeta | null>(null);

  const [localOverallReport, setLocalOverallReport] =
    useState<MarkdownReportResponse | null>(null);
  const [localFourWeekReport, setLocalFourWeekReport] =
    useState<MarkdownReportResponse | null>(null);
  const [localReportLoading, setLocalReportLoading] = useState(false);
  const [localReportError, setLocalReportError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const fetchLatestReports = async () => {
    setLocalReportLoading(true);
    setLocalReportError(null);
    try {
      const [repOverall, rep4W] = await Promise.all([
        nexusDemandApi.getMarketSegmentationReport(),
        nexusDemandApi.get4WeeksSegmentationReport(),
      ]);
      setLocalOverallReport(repOverall);
      setLocalFourWeekReport(rep4W);
    } catch (err: unknown) {
      setLocalReportError(
        err instanceof Error
          ? err.message
          : 'Failed loading weekly market segment reports.'
      );
    } finally {
      setLocalReportLoading(false);
    }
  };

  useEffect(() => {
    if (!propOverallReport && !propFourWeekReport && !propReportsLoading) {
      fetchLatestReports();
    }
  }, [propOverallReport, propFourWeekReport, propReportsLoading]);

  const effectiveOverallReport = localOverallReport ?? propOverallReport;
  const effectiveFourWeekReport = localFourWeekReport ?? propFourWeekReport;
  const reportLoading = localReportLoading || propReportsLoading;
  const reportError = localReportError || propReportsError;

  const baseDataset = mode === 'overall' ? overallClusters : fourWeekClusters;
  const activeDataset =
    mode === 'overall'
      ? queriedOverall ?? overallClusters
      : queried4W ?? fourWeekClusters;
  const activeReport =
    mode === 'overall' ? effectiveOverallReport : effectiveFourWeekReport;

  // Dynamically parse the live weekly report content alongside the current dataset
  const parsedReport = useMemo(
    () => parseSegmentationReport(activeReport, baseDataset),
    [activeReport, baseDataset]
  );

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

      const [res, freshReport] = await Promise.all([
        mode === 'overall'
          ? nexusDemandApi.getMarketSegmentation(validatedFilter, (meta) =>
              setPipelineMeta(meta)
            )
          : nexusDemandApi.get4WeeksSegmentation(validatedFilter, (meta) =>
              setPipelineMeta(meta)
            ),
        mode === 'overall'
          ? nexusDemandApi.getMarketSegmentationReport().catch(() => null)
          : nexusDemandApi.get4WeeksSegmentationReport().catch(() => null),
      ]);

      if (mode === 'overall') {
        setQueriedOverall(res.data);
        if (freshReport) setLocalOverallReport(freshReport);
      } else {
        setQueried4W(res.data);
        if (freshReport) setLocalFourWeekReport(freshReport);
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
              sample.Cluster_Name || 'Market Segment'
            })`
          : `${res.total_records} markets matched`,
        numericResult: res.total_records,
        recordDate:
          mode === 'overall' ? '3+ Year History' : 'Recent 4-Week Window',
        predictionStatus: 'success',
        notes: `Segment filter: ${segmentFilter}`,
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
          notes: `Segment filter: ${segmentFilter}`,
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

  const marketSegments = useMemo(() => {
    const map = new Map<
      number,
      {
        label: number;
        name: string;
        count: number;
        avgInterest: number;
        avgMedia: number;
        avgRatio: number;
        avgSlope: number;
        avgSentiment: number;
        keyInsightsSummary: string;
        coreBusinessQuestion: string;
      }
    >();

    baseDataset.forEach((row) => {
      const id = row.Cluster_Label ?? -1;
      const reportSegment = parsedReport?.clusterMap[id];
      const existing = map.get(id);
      if (!existing) {
        map.set(id, {
          label: id,
          name:
            reportSegment?.clusterName ||
            row.Cluster_Name ||
            `Market Segment ${id + 1}`,
          count: 1,
          avgInterest: row.mean_search_interest,
          avgMedia: row.mean_media_volume,
          avgRatio: row.mean_demand_to_hype_ratio,
          avgSlope: row.search_interest_trend_slope,
          avgSentiment: row.mean_net_sentiment,
          keyInsightsSummary: reportSegment?.keyInsightsSummary || '',
          coreBusinessQuestion: reportSegment?.coreBusinessQuestion || '',
        });
      } else {
        const nextCount = existing.count + 1;
        existing.avgInterest =
          (existing.avgInterest * existing.count + row.mean_search_interest) /
          nextCount;
        existing.avgMedia =
          (existing.avgMedia * existing.count + row.mean_media_volume) /
          nextCount;
        existing.avgRatio =
          (existing.avgRatio * existing.count +
            row.mean_demand_to_hype_ratio) /
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

    if (map.size === 0 && parsedReport) {
      for (const c of parsedReport.clusters) {
        map.set(c.clusterLabel, {
          label: c.clusterLabel,
          name: c.clusterName,
          count: c.marketCount,
          avgInterest: 0,
          avgMedia: 0,
          avgRatio: 0,
          avgSlope: 0,
          avgSentiment: 0,
          keyInsightsSummary: c.keyInsightsSummary,
          coreBusinessQuestion: c.coreBusinessQuestion,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.label - b.label);
  }, [baseDataset, parsedReport]);

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
        segmentFilter !== 'all' &&
        String(row.Cluster_Label) !== segmentFilter
      ) {
        return false;
      }
      return true;
    });
  }, [activeDataset, countryFilter, categoryFilter, segmentFilter]);

  const spotlightSegmentReport = useMemo(() => {
    if (!parsedReport) return null;
    if (segmentFilter !== 'all') {
      const id = Number.parseInt(segmentFilter, 10);
      return parsedReport.clusterMap[id] || null;
    }
    if (filteredRows.length > 0) {
      const uniqueLabels = new Set(
        filteredRows
          .map((r) => r.Cluster_Label)
          .filter((l): l is number => typeof l === 'number')
      );
      if (uniqueLabels.size === 1) {
        const singleLabel = Array.from(uniqueLabels)[0];
        return parsedReport.clusterMap[singleLabel] || null;
      }
    }
    return null;
  }, [parsedReport, segmentFilter, filteredRows]);

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
      'Segment_Name',
    ];
    const csvLines = [
      headers.join(','),
      ...filteredRows.map((r) => {
        const segId = r.Cluster_Label ?? -1;
        const segName =
          parsedReport?.clusterMap[segId]?.clusterName ||
          r.Cluster_Name ||
          'Unassigned';
        return [
          r.country_name,
          r.category,
          r.mean_search_interest,
          r.mean_media_volume,
          r.mean_demand_to_hype_ratio,
          r.search_interest_trend_slope,
          r.mean_net_sentiment,
          r.mean_gdp_per_capita,
          `"${segName.replace(/"/g, '""')}"`,
        ].join(',');
      }),
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

  const handleDownloadMarkdownReport = () => {
    if (!activeReport) return;
    const blob = new Blob([activeReport.content], {
      type: 'text/markdown;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `demandaura_${mode}_segmentation_report.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSyncWeeklyReports = async () => {
    await Promise.all([
      fetchLatestReports(),
      onRefreshAll ? onRefreshAll() : Promise.resolve(),
    ]);
  };

  const isProcessing = clustersLoading || queryLoading;

  const SEGMENT_PALETTE = [
    '#0D9488', // Teal
    '#0284C7', // Sky Blue
    '#4F46E5', // Indigo
    '#7C3AED', // Violet
    '#059669', // Emerald
    '#D97706', // Amber
    '#E11D48', // Rose
  ];

  const SEGMENT_TOP_BARS = [
    'from-teal-400 to-cyan-500',
    'from-sky-400 to-blue-600',
    'from-indigo-400 to-violet-600',
    'from-purple-400 to-fuchsia-600',
    'from-emerald-400 to-teal-600',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-600',
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
      {/* Atmospheric Header & Mode Switcher */}
      <div className="bg-aura-banner text-white rounded-2xl p-6 lg:p-8 border border-slate-800 shadow-lg flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-300 font-medium">
            <span>Global Market Segmentation &amp; Weekly Reports</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">
              {mode === 'overall'
                ? 'Long-Term Multi-Year Market Structure (Updated Weekly)'
                : 'Most Recent 4 Weeks of Market Momentum (Updated Weekly)'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Global Market Segmentation &amp; Dynamic Weekly Reports
          </h1>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            Compare how all 42 country–category markets group together across{' '}
            <strong className="text-white">multi-year long-term history</strong> versus the{' '}
            <strong className="text-white">most recent 4 weeks</strong>. Every week, both the market
            segments and the executive reports update automatically from the
            backend pipeline—explaining each segment&apos;s metric trends,
            business interpretation, recommended use case, and core business
            question answered.
          </p>
        </div>

        {/* Segmented Horizon Switcher */}
        <div className="flex items-center gap-1 p-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl self-start">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => {
              setMode('overall');
              setSegmentFilter('all');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 ${
              mode === 'overall'
                ? 'btn-aura-primary text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Long-Term Market Structure (3+ Years)
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => {
              setMode('4w');
              setSegmentFilter('all');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 ${
              mode === '4w'
                ? 'btn-aura-primary text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
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
            ? '3+ Year Market Segmentation & Report'
            : '4-Week Momentum Segmentation & Report'
        }
      />

      {/* Dynamic Weekly Market Segment Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-semibold text-slate-900">
            {mode === 'overall'
              ? `Discovered Long-Term Market Segments This Week (${marketSegments.length} Active Segments · Click any segment to view its weekly report & filter markets)`
              : `Discovered 4-Week Momentum Profiles This Week (${marketSegments.length} Active Profiles · Click any profile to view its weekly report & filter markets)`}
          </div>
          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === 'report' ? 'table' : 'report')
            }
            className="text-xs font-medium text-slate-700 hover:text-slate-900 underline inline-flex items-center gap-1 cursor-pointer self-start"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>
              {activeTab === 'report'
                ? 'Switch to Market Map & Table'
                : `Read Full Weekly Executive Report (${
                    parsedReport?.clusters.length || marketSegments.length
                  } Segments)`}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketSegments.map((seg, idx) => {
            const selected = segmentFilter === String(seg.label);
            const topBar = SEGMENT_TOP_BARS[idx % SEGMENT_TOP_BARS.length];
            return (
              <button
                key={seg.label}
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  setSegmentFilter(selected ? 'all' : String(seg.label))
                }
                className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden disabled:opacity-60 ${
                  selected
                    ? 'bg-[#09132C] text-white border-cyan-500/50 shadow-md'
                    : 'card-aura text-slate-900 hover:border-cyan-300'
                }`}
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${topBar}`}
                />
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold leading-snug">
                      {seg.name}
                    </div>
                    <span
                      className={`text-xs font-mono-tabular shrink-0 ${
                        selected ? 'text-cyan-300' : 'text-teal-700 font-semibold'
                      }`}
                    >
                      {seg.count} {seg.count === 1 ? 'market' : 'markets'}
                    </span>
                  </div>
                  {seg.keyInsightsSummary && (
                    <p
                      className={`text-xs leading-relaxed line-clamp-2 ${
                        selected ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {seg.keyInsightsSummary}
                    </p>
                  )}
                </div>

                <div
                  className={`pt-2 border-t grid grid-cols-2 gap-2 text-xs font-mono-tabular ${
                    selected
                      ? 'border-slate-800 text-slate-300'
                      : 'border-slate-100 text-slate-600'
                  }`}
                >
                  <div>Search: {seg.avgInterest.toFixed(1)}</div>
                  <div>
                    Trend: {seg.avgSlope >= 0 ? '+' : ''}
                    {seg.avgSlope.toFixed(2)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & View Switcher Controls */}
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
            value={segmentFilter}
            disabled={isProcessing}
            onChange={(e) => setSegmentFilter(e.target.value)}
            aria-label="Filter by Market Segment"
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-50"
          >
            <option value="all">All Market Segments</option>
            {marketSegments.map((seg) => (
              <option key={seg.label} value={String(seg.label)}>
                {seg.name} ({seg.count})
              </option>
            ))}
          </select>

          {(countryFilter ||
            categoryFilter ||
            segmentFilter !== 'all' ||
            queriedOverall ||
            queried4W) && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                setCountryFilter('');
                setCategoryFilter('');
                setSegmentFilter('all');
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
            className="px-4 py-2 text-xs font-semibold text-white btn-aura-primary rounded-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {queryLoading
              ? `Syncing Weekly Data (${(elapsedMs / 1000).toFixed(1)}s)...`
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
              Executive Report (
              {parsedReport?.clusters.length || marketSegments.length})
            </button>
          </div>
        </div>
      </form>

      {activeTab === 'table' ? (
        <div className="space-y-8">
          {/* Dynamic Weekly Report Spotlight when a segment or single-segment market is selected */}
          {spotlightSegmentReport && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Live Weekly Segment Report Intelligence</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {spotlightSegmentReport.recordCountText}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {spotlightSegmentReport.clusterName}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('report')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                  >
                    Open Full Weekly Report
                  </button>
                  {segmentFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSegmentFilter('all')}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                    >
                      Show All Segments
                    </button>
                  )}
                </div>
              </div>

              {spotlightSegmentReport.coreBusinessQuestion && (
                <div className="border-l-2 border-slate-900 pl-4 py-1 bg-slate-50/70 rounded-r-lg">
                  <div className="text-xs font-semibold text-slate-900">
                    Core Business Question Answered:
                  </div>
                  <p className="text-sm text-slate-700 italic">
                    &ldquo;{spotlightSegmentReport.coreBusinessQuestion}&rdquo;
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                  <div className="font-semibold text-slate-900">
                    Metric Trends &amp; Summary
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {spotlightSegmentReport.metricTrends ||
                      spotlightSegmentReport.keyInsightsSummary}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                  <div className="font-semibold text-slate-900">
                    Business Interpretation
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {spotlightSegmentReport.businessInterpretation ||
                      spotlightSegmentReport.keyInsightsSummary}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                  <div className="font-semibold text-slate-900">
                    Recommended Business Use Case
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {spotlightSegmentReport.businessUseCase ||
                      'Tailor marketing and inventory strategy to match this market profile.'}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                      const repInfo =
                        typeof rec.Cluster_Label === 'number'
                          ? parsedReport?.clusterMap[rec.Cluster_Label]
                          : undefined;
                      return (
                        <div className="bg-slate-900 text-white p-3.5 rounded-lg text-xs space-y-1.5 shadow-lg max-w-xs">
                          <div className="font-semibold">
                            {formatEntityLabel(rec.country_name)} ·{' '}
                            {formatEntityLabel(rec.category)}
                          </div>
                          <div className="text-slate-300 font-medium">
                            {repInfo?.clusterName ||
                              rec.Cluster_Name ||
                              'Market Segment'}
                          </div>
                          {repInfo?.keyInsightsSummary && (
                            <div className="text-slate-400 leading-snug">
                              {repInfo.keyInsightsSummary}
                            </div>
                          )}
                          <div className="font-mono-tabular pt-1 border-t border-slate-800 space-y-0.5">
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
                    fill="#0284C7"
                  >
                    {filteredRows.map((entry, idx) => {
                      const segIndex =
                        typeof entry.Cluster_Label === 'number' &&
                        entry.Cluster_Label >= 0
                          ? entry.Cluster_Label
                          : idx;
                      return (
                        <Cell
                          key={`cell-${entry.country_name}-${entry.category}`}
                          fill={
                            SEGMENT_PALETTE[segIndex % SEGMENT_PALETTE.length]
                          }
                        />
                      );
                    })}
                  </Scatter>
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
                  ? '3+ Year Historical Averages · Click any Segment Name to view report insights'
                  : 'Most Recent 4-Week Averages · Click any Segment Name to view report insights'}
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
                      <th className="py-3 px-4 font-medium">Market Segment</th>
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
                    {filteredRows.map((row) => {
                      const segId = row.Cluster_Label ?? -1;
                      const repSegment = parsedReport?.clusterMap[segId];
                      return (
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
                            <button
                              type="button"
                              onClick={() =>
                                setSegmentFilter(
                                  segmentFilter === String(segId)
                                    ? 'all'
                                    : String(segId)
                                )
                              }
                              className="text-left hover:underline cursor-pointer font-medium text-slate-900"
                              title={
                                repSegment?.keyInsightsSummary ||
                                'Click to filter and view weekly report for this market segment'
                              }
                            >
                              {repSegment?.clusterName ||
                                row.Cluster_Name ||
                                'Unassigned'}
                            </button>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Dynamic Weekly Executive Report Tab */
        <div className="space-y-8">
          {/* Report Header & Sync Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Live Weekly Backend Report</span>
                <span aria-hidden="true">·</span>
                <span>
                  {mode === 'overall'
                    ? 'Source: /reports/market-segmentation'
                    : 'Source: /reports/4-weeks-segmentation'}
                </span>
                <span aria-hidden="true">·</span>
                <span>Dynamically Updated Every Week</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                {parsedReport?.reportTitle ||
                  (mode === 'overall'
                    ? 'Overall Market Segmentation Report (3+ Years)'
                    : '4-Week Market Segmentation Report')}
              </h2>
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                This report is generated by the backend pipeline and parsed
                dynamically every week. As consumer search interest, media
                volume, and sentiment shift, the segment names, market counts,
                metric trends, and business use cases automatically update here.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={reportLoading}
                onClick={handleSyncWeeklyReports}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    reportLoading ? 'animate-spin' : ''
                  }`}
                />
                <span>Sync Latest Weekly Report</span>
              </button>

              {activeReport && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadMarkdownReport}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRawMarkdown((prev) => !prev)}
                    className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {showRawMarkdown
                      ? 'View Structured Report'
                      : 'View Raw Markdown'}
                  </button>
                </>
              )}
            </div>
          </div>

          {reportLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-4">
              <div className="h-6 w-64 bg-slate-100 rounded animate-pulse" />
              <div className="h-32 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-48 w-full bg-slate-100 rounded animate-pulse" />
            </div>
          ) : reportError ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-3">
              <div className="font-semibold">
                Unable to load weekly segmentation report
              </div>
              <div>{reportError}</div>
              <button
                type="button"
                onClick={handleSyncWeeklyReports}
                className="px-3 py-1.5 bg-red-900 text-white rounded-md font-medium cursor-pointer"
              >
                Retry Loading Report
              </button>
            </div>
          ) : !activeReport || !parsedReport ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-xs text-slate-500">
              No weekly segmentation report available yet.
            </div>
          ) : showRawMarkdown ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="text-xs font-semibold text-slate-900">
                Raw Markdown Content ({activeReport.report_title})
              </div>
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-200 overflow-x-auto">
                {activeReport.content}
              </pre>
            </div>
          ) : (
            <div className="space-y-8">
              {/* SECTION 1: SUMMARY TABLE (Using Segment Names Directly) */}
              {parsedReport.summaryRows.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-500">
                        Section 1 · Weekly Executive Summary Table
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Discovered Market Segments Overview (
                        {parsedReport.summaryRows.length} Segments in Current
                        Weekly Run)
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      Click &ldquo;Filter Markets&rdquo; to inspect any segment on
                      the Market Map
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                          <th className="py-3 px-4 font-medium whitespace-nowrap">
                            Market Segment Name
                          </th>
                          <th className="py-3 px-4 font-medium whitespace-nowrap">
                            Market Count
                          </th>
                          <th className="py-3 px-4 font-medium">
                            Key Insights Summary (From Weekly Report)
                          </th>
                          <th className="py-3 px-4 font-medium text-right whitespace-nowrap">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedReport.summaryRows.map((row) => (
                          <tr
                            key={row.clusterLabel}
                            className="hover:bg-slate-50"
                          >
                            <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                              {row.clusterName}
                            </td>
                            <td className="py-3 px-4 font-mono-tabular text-slate-700 whitespace-nowrap">
                              {row.marketCount}{' '}
                              {row.marketCount === 1 ? 'market' : 'markets'}
                            </td>
                            <td className="py-3 px-4 text-slate-600 leading-relaxed">
                              {row.keyInsightsSummary}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSegmentFilter(String(row.clusterLabel));
                                  setActiveTab('table');
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-slate-900 border border-slate-200 rounded-md hover:bg-slate-100 cursor-pointer"
                              >
                                Filter Markets
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION 2: DETAILED SEGMENT BREAKDOWN */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">
                    Section 2 · Detailed Market Segment Breakdown
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Strategic Interpretation, Metric Trends &amp; Business Use
                    Cases
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {parsedReport.clusters.map((segment) => (
                    <div
                      key={segment.clusterLabel}
                      className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono-tabular">
                            <span>Market Segment</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              Record Count: {segment.recordCountText}
                            </span>
                          </div>
                          <h4 className="text-lg font-semibold text-slate-900">
                            {segment.clusterName}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSegmentFilter(String(segment.clusterLabel));
                            setActiveTab('table');
                          }}
                          className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer whitespace-nowrap self-start"
                        >
                          View {segment.marketCount}{' '}
                          {segment.marketCount === 1 ? 'Market' : 'Markets'} on
                          Map
                        </button>
                      </div>

                      {segment.coreBusinessQuestion && (
                        <div className="border-l-2 border-slate-900 pl-4 py-1.5 bg-slate-50/70 rounded-r-lg space-y-0.5">
                          <div className="text-xs font-semibold text-slate-900">
                            Core Business Question Answered:
                          </div>
                          <p className="text-sm text-slate-800 italic">
                            &ldquo;{segment.coreBusinessQuestion}&rdquo;
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                          <div className="font-semibold text-slate-900">
                            Metric Trends
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            {segment.metricTrends || segment.keyInsightsSummary}
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                          <div className="font-semibold text-slate-900">
                            Business Interpretation
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            {segment.businessInterpretation ||
                              segment.keyInsightsSummary}
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                          <div className="font-semibold text-slate-900">
                            Recommended Business Use Case
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            {segment.businessUseCase ||
                              segment.keyInsightsSummary}
                          </p>
                        </div>
                      </div>

                      {segment.additionalBullets.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {segment.additionalBullets.map((b) => (
                            <div
                              key={b.label}
                              className="p-3 bg-slate-50 border border-slate-100 rounded-lg"
                            >
                              <span className="font-semibold text-slate-900">
                                {b.label}:{' '}
                              </span>
                              <span className="text-slate-600">{b.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {segment.markets.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="text-xs font-semibold text-slate-900">
                            Assigned Country–Category Markets This Week (
                            {segment.markets.length}):
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {segment.markets.map((m) => (
                              <button
                                key={`${m.country_name}-${m.category}`}
                                type="button"
                                onClick={() => {
                                  setCountryFilter(
                                    m.country_name as CanonicalCountry
                                  );
                                  setCategoryFilter(
                                    m.category as CanonicalCategory
                                  );
                                  setSegmentFilter('all');
                                  setActiveTab('table');
                                }}
                                className="px-2.5 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition-colors cursor-pointer"
                                title={`Search Interest: ${m.mean_search_interest.toFixed(
                                  1
                                )} | Demand Trend: ${
                                  m.search_interest_trend_slope >= 0 ? '+' : ''
                                }${m.search_interest_trend_slope.toFixed(2)}`}
                              >
                                <span className="font-medium text-slate-900">
                                  {formatEntityLabel(m.country_name)}
                                </span>{' '}
                                · {formatEntityLabel(m.category)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
