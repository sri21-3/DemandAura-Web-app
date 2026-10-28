import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  History,
  Info,
  Layers,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  PipelineErrorState,
  PipelineFlowStatus,
} from '../components/PipelineFlowStatus';
import {
  API_ENDPOINTS,
  formatEntityLabel,
  MODEL_SPECIFICATIONS,
  VALID_CATEGORIES,
  VALID_COUNTRIES,
} from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  COLD_START_THRESHOLD_MS,
  constructPredictionPayload,
  MlPipelineError,
  nexusDemandApi,
  validateRequiredMarketInput,
} from '../services/nexusDemandApi';
import {
  CanonicalCategory,
  CanonicalCountry,
  DivergenceResponse,
  ForecastResponse,
  MarkdownReportResponse,
  PipelineExecutionMeta,
  SegmentationRecord,
} from '../types/models';
import { parseSegmentationReport } from '../utils/reportParser';

/**
 * Clean date formatter to display clear week dates instead of W-1, W+1 relative tags.
 * e.g., "2026-09-27" -> "Sep 27" (short), "Sep 27, 2026" (standard), "Week of Sep 27, 2026" (full)
 */
export function formatWeekDate(
  isoDate: string,
  format: 'short' | 'standard' | 'full' = 'standard'
): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthName = monthNames[monthIdx] || parts[1];
    const paddedDay = day < 10 ? `0${day}` : `${day}`;

    if (format === 'short') {
      return `${monthName} ${paddedDay}`;
    }
    if (format === 'full') {
      return `Week of ${monthName} ${paddedDay}, ${year}`;
    }
    return `${monthName} ${paddedDay}, ${year}`;
  }
  return isoDate;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      week_date: string;
      actualValue: number | null;
      forecastValue: number | null;
      stepDelta: number | null;
      stage: 'historical' | 'forecast';
      isStitch?: boolean;
    };
  }>;
}

const ChartCustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const isHistorical = data.stage === 'historical';
  const val =
    data.actualValue !== null && data.actualValue !== undefined
      ? data.actualValue
      : data.forecastValue;

  return (
    <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-white space-y-2 min-w-[240px]">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-200">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>{formatWeekDate(data.week_date, 'full')}</span>
        </div>
        <span
          className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
            isHistorical
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
          }`}
        >
          {isHistorical ? 'Historical Actual' : 'Projection'}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <span className="text-slate-400">Search Interest:</span>
          <span className="font-mono font-bold text-sm text-white">
            {typeof val === 'number' ? val.toFixed(2) : '-'}
            <span className="text-[11px] font-normal text-slate-400"> / 100</span>
          </span>
        </div>

        {data.stepDelta !== null && data.stepDelta !== undefined && (
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Week-over-Week Shift:</span>
            <span
              className={`font-mono font-semibold flex items-center gap-0.5 ${
                data.stepDelta >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {data.stepDelta >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {data.stepDelta >= 0 ? '+' : ''}
              {data.stepDelta.toFixed(2)} pts
            </span>
          </div>
        )}

        <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/80">
          {isHistorical
            ? 'Ground-truth verified consumer search index'
            : 'Forward projection'}
        </div>
      </div>
    </div>
  );
};

export interface DemandForecastPageProps {
  overallClusters?: SegmentationRecord[];
  fourWeekClusters?: SegmentationRecord[];
  overallReport?: MarkdownReportResponse | null;
  fourWeekReport?: MarkdownReportResponse | null;
  initialViewMode?: 'all' | 'forecast' | 'divergence';
}

export const DemandForecastPage: React.FC<DemandForecastPageProps> = ({
  overallClusters = [],
  fourWeekClusters = [],
  overallReport = null,
  fourWeekReport = null,
  initialViewMode = 'all',
}) => {
  const { profile, logPrediction } = useAuth();

  const [selectedCountry, setSelectedCountry] =
    useState<CanonicalCountry>('United_States');
  const [selectedCategory, setSelectedCategory] =
    useState<CanonicalCategory>('Fashion_Beauty');
  const [notes, setNotes] = useState('');

  // Page layout focus: 'all' (unified side-by-side / stacked), 'forecast', or 'divergence'
  const [activeTab, setActiveTab] = useState<'all' | 'forecast' | 'divergence'>(
    initialViewMode
  );

  // Execution states
  const [loading, setLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<PipelineErrorState | null>(null);
  const [pipelineMeta, setPipelineMeta] =
    useState<PipelineExecutionMeta | null>(null);

  // Model outputs
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [divergence, setDivergence] = useState<DivergenceResponse | null>(null);

  // Display toggles
  const [tableFilter, setTableFilter] = useState<'all' | 'forecast' | 'historical'>(
    'all'
  );

  const timerRef = useRef<number | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (profile?.preferredCountry) {
      setSelectedCountry(profile.preferredCountry);
    }
    if (profile?.preferredCategory) {
      setSelectedCategory(profile.preferredCategory);
    }
  }, [profile]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  // Preset quick selectors for rapid exploration
  const presetMarkets: {
    country: CanonicalCountry;
    category: CanonicalCategory;
    tag: string;
  }[] = [
    {
      country: 'United_States',
      category: 'Fashion_Beauty',
      tag: 'United States · Fashion & Beauty',
    },
    {
      country: 'United_States',
      category: 'Nutrition_Diets',
      tag: 'United States · Nutrition & Diets',
    },
    {
      country: 'United_Arab_Emirates',
      category: 'Fitness_Wearables',
      tag: 'UAE · Fitness & Wearables',
    },
    {
      country: 'India',
      category: 'Nutrition_Diets',
      tag: 'India · Nutrition & Diets',
    },
  ];

  // Execute full combined analysis (Divergence + Forecast)
  const handleRunCombinedAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;

    setLoading(true);
    setElapsedMs(0);
    setError(null);

    if (outputRef.current && window.innerWidth < 1024) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const startTs = performance.now();
    timerRef.current = window.setInterval(() => {
      setElapsedMs(Math.round(performance.now() - startTs));
    }, 200);

    try {
      // Validate inputs
      const validatedInput = validateRequiredMarketInput(
        {
          country_name: selectedCountry,
          category: selectedCategory,
        },
        API_ENDPOINTS.FORECAST_SEARCH_INTEREST
      );
      const payload = constructPredictionPayload(validatedInput);

      // Execute both model endpoints concurrently
      const [fcResult, divResult] = await Promise.all([
        nexusDemandApi.forecastSearchInterest(payload, (meta) => {
          setPipelineMeta(meta);
        }),
        nexusDemandApi.predictDivergence(payload),
      ]);

      setForecast(fcResult);
      setDivergence(divResult);

      // Compute audit summary
      const pts = fcResult.forecast_points || [];
      const meanVal =
        pts.length > 0
          ? pts.reduce((acc, p) => acc + p.predicted_search_interest, 0) /
            pts.length
          : 0;
      const horizonLabel =
        pts.length > 0
          ? `${formatWeekDate(pts[0].week_date, 'standard')} → ${formatWeekDate(
              pts[pts.length - 1].week_date,
              'standard'
            )}`
          : '4-Week Outlook';

      await logPrediction({
        modelType: 'forecast',
        modelDisplayName: 'Demand & Forecast Analysis',
        countryName: fcResult.country_name,
        category: fcResult.category,
        summaryValue: `Divergence: ${
          divResult.predicted_divergence_score >= 0 ? '+' : ''
        }${divResult.predicted_divergence_score.toFixed(
          2
        )} | 4W Forecast Avg: ${meanVal.toFixed(2)}`,
        numericResult: Number(meanVal.toFixed(4)),
        recordDate: horizonLabel,
        predictionStatus: 'success',
        notes,
      });
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error
          ? err.message
          : 'Failed to complete demand analysis and forecast.';

      if (err instanceof MlPipelineError) {
        setError({
          category: err.category,
          message: err.message,
          statusCode: err.statusCode,
          endpoint: err.endpoint,
        });
      } else {
        setError({
          category: 'backend_error',
          message: errMessage,
          endpoint: API_ENDPOINTS.FORECAST_SEARCH_INTEREST,
        });
      }

      try {
        await logPrediction({
          modelType: 'forecast',
          modelDisplayName: 'Demand & Forecast Analysis',
          countryName: selectedCountry,
          category: selectedCategory,
          summaryValue: `Error: ${errMessage.slice(0, 140)}`,
          numericResult: 0,
          recordDate: new Date().toISOString().slice(0, 10),
          predictionStatus: 'error',
          notes,
        });
      } catch {
        // Non-blocking
      }
    } finally {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setLoading(false);
    }
  };

  // Forecast data processing
  const historical = forecast?.historical_points || [];
  const forecastPoints = forecast?.forecast_points || [];

  const hasHistorical = historical.length > 0;
  const meanHistorical =
    hasHistorical
      ? historical.reduce((acc, p) => acc + p.search_interest, 0) /
        historical.length
      : 0;
  const lastHistorical = hasHistorical ? historical[historical.length - 1] : null;

  const meanForecast =
    forecastPoints.length > 0
      ? forecastPoints.reduce((acc, p) => acc + p.predicted_search_interest, 0) /
        forecastPoints.length
      : 0;
  const wk1 = forecastPoints[0]?.predicted_search_interest ?? 0;
  const wk4 = forecastPoints[forecastPoints.length - 1]?.predicted_search_interest ?? 0;
  const forecastNetDelta = wk4 - wk1;

  const peakPoint =
    forecastPoints.length > 0
      ? forecastPoints.reduce((best, p) =>
          p.predicted_search_interest > best.predicted_search_interest ? p : best
        )
      : null;

  const momentumShift = hasHistorical
    ? meanForecast - meanHistorical
    : forecastNetDelta;
  const momentumPct =
    hasHistorical && meanHistorical > 0
      ? ((meanForecast - meanHistorical) / meanHistorical) * 100
      : 0;

  // Build unified continuous 8-week array with readable week dates (NO W+1/W-1)
  interface TimelinePoint {
    week_date: string;
    shortDate: string;
    formattedDate: string;
    actualSearchInterest: number | null;
    predictedSearchInterest: number | null;
    actualValue: number | null;
    forecastValue: number | null;
    stepDelta: number | null;
    stage: 'historical' | 'forecast';
    isStitch?: boolean;
  }

  const combinedTimeline: TimelinePoint[] = [];

  // Historical segment (4 verified prior weeks)
  historical.forEach((pt, idx) => {
    const prevPt = idx > 0 ? historical[idx - 1] : null;
    const stepDelta = prevPt ? pt.search_interest - prevPt.search_interest : null;
    const isLastHist = idx === historical.length - 1;

    combinedTimeline.push({
      week_date: pt.week_date,
      shortDate: formatWeekDate(pt.week_date, 'short'),
      formattedDate: formatWeekDate(pt.week_date, 'full'),
      actualSearchInterest: pt.search_interest,
      predictedSearchInterest: isLastHist ? pt.search_interest : null,
      actualValue: pt.search_interest,
      forecastValue: isLastHist ? pt.search_interest : null,
      stepDelta,
      stage: 'historical',
      isStitch: isLastHist,
    });
  });

  // Forecast segment (4 upcoming forward weeks)
  forecastPoints.forEach((pt, idx) => {
    const prevValue =
      idx > 0
        ? forecastPoints[idx - 1].predicted_search_interest
        : lastHistorical
        ? lastHistorical.search_interest
        : null;
    const stepDelta =
      prevValue !== null ? pt.predicted_search_interest - prevValue : null;

    combinedTimeline.push({
      week_date: pt.week_date,
      shortDate: formatWeekDate(pt.week_date, 'short'),
      formattedDate: formatWeekDate(pt.week_date, 'full'),
      actualSearchInterest: null,
      predictedSearchInterest: pt.predicted_search_interest,
      actualValue: null,
      forecastValue: pt.predicted_search_interest,
      stepDelta,
      stage: 'forecast',
    });
  });

  // Filtered rows for schedule table
  const filteredTableRows = combinedTimeline.filter((row) => {
    if (tableFilter === 'forecast') return row.stage === 'forecast';
    if (tableFilter === 'historical') return row.stage === 'historical';
    return true;
  });

  // Divergence Gauge calculations
  const minRange = MODEL_SPECIFICATIONS.divergence.metrics.targetRange[0];
  const maxRange = MODEL_SPECIFICATIONS.divergence.metrics.targetRange[1];
  const scoreVal = divergence?.predicted_divergence_score ?? 0;
  const clampedScore = Math.max(minRange, Math.min(maxRange, scoreVal));
  const gaugePercent =
    ((clampedScore - minRange) / (maxRange - minRange)) * 100;
  const zeroMarkerPercent = ((0 - minRange) / (maxRange - minRange)) * 100;

  // Supporting Market Clusters Context
  const activeCountry =
    (forecast?.country_name as CanonicalCountry) ||
    (divergence?.country_name as CanonicalCountry) ||
    selectedCountry;
  const activeCategory =
    (forecast?.category as CanonicalCategory) ||
    (divergence?.category as CanonicalCategory) ||
    selectedCategory;

  const matchedOverall = overallClusters.find(
    (c) =>
      c.country_name.toLowerCase() === activeCountry.toLowerCase() &&
      c.category.toLowerCase() === activeCategory.toLowerCase()
  );

  const matched4W = fourWeekClusters.find(
    (c) =>
      c.country_name.toLowerCase() === activeCountry.toLowerCase() &&
      c.category.toLowerCase() === activeCategory.toLowerCase()
  );

  const parsedOverallReport = useMemo(
    () => parseSegmentationReport(overallReport, overallClusters),
    [overallReport, overallClusters]
  );

  const parsed4WReport = useMemo(
    () => parseSegmentationReport(fourWeekReport, fourWeekClusters),
    [fourWeekReport, fourWeekClusters]
  );

  const matchedOverallReportCluster =
    typeof matchedOverall?.Cluster_Label === 'number'
      ? parsedOverallReport?.clusterMap[matchedOverall.Cluster_Label]
      : undefined;

  const matched4WReportCluster =
    typeof matched4W?.Cluster_Label === 'number'
      ? parsed4WReport?.clusterMap[matched4W.Cluster_Label]
      : undefined;

  const selectedCategoryObj = VALID_CATEGORIES.find(
    (c) => c.value === selectedCategory
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
      {/* Page Header Banner */}
      <div className="bg-aura-banner text-white rounded-2xl px-6 py-5 border border-slate-800 shadow-lg space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-300 font-medium">
            <span className="flex items-center gap-1 text-emerald-300">
              <Activity className="w-3.5 h-3.5" />
              Demand vs. Hype Divergence
            </span>
            <span aria-hidden="true" className="text-slate-600">➔</span>
            <span className="flex items-center gap-1 text-cyan-300">
              <History className="w-3.5 h-3.5" />
              4W Historical Actuals
            </span>
            <span aria-hidden="true" className="text-slate-600">➔</span>
            <span className="flex items-center gap-1 text-teal-300 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              4W Forward Forecast
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">14 Countries × 3 Categories</span>
          </div>

          {/* Sub-view Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Unified Demand View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('forecast')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'forecast'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              8-Week Trajectory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('divergence')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'divergence'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Demand vs. Hype Divergence
            </button>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Market Demand Intelligence: Divergence &amp; 8-Week Forecast
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Unifies <strong>shopper demand vs. media hype balance</strong> with{' '}
          <strong>4-week verified historical ground truth</strong> and a{' '}
          <strong>4-week recursive forward projection</strong>. Gain complete visibility
          into whether consumer intent is genuine and where it is heading week-by-week.
        </p>
      </div>

      {/* Pipeline Status Banner */}
      <PipelineFlowStatus
        loading={loading}
        elapsedMs={elapsedMs}
        isColdStart={elapsedMs >= COLD_START_THRESHOLD_MS}
        error={error}
        meta={pipelineMeta}
        onRetry={() => handleRunCombinedAnalysis()}
        modelLabel="Demand & Forecast Intelligence Pipeline"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Shared Market Controls */}
        <div className="lg:col-span-4 card-aura rounded-2xl p-6 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-cyan-500 to-indigo-500" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Select Market to Analyze
            </h2>
            <p className="text-xs text-slate-500">
              Evaluate consumer demand, media saturation, and the 8-week search
              trajectory for any country and category.
            </p>
          </div>

          {/* Preset Quick Selectors */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">
              Popular Market Comparisons
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presetMarkets.map((preset) => (
                <button
                  key={`${preset.country}-${preset.category}`}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setSelectedCountry(preset.country);
                    setSelectedCategory(preset.category);
                  }}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 ${
                    selectedCountry === preset.country &&
                    selectedCategory === preset.category
                      ? 'btn-aura-primary border-transparent font-medium'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-teal-50/60 hover:border-teal-300'
                  }`}
                >
                  {preset.tag}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRunCombinedAnalysis} className="space-y-5" noValidate>
            {/* Target Country */}
            <div className="space-y-1.5">
              <label
                htmlFor="df-country"
                className="block text-xs font-semibold text-slate-800"
              >
                Target Country <span className="text-red-600">*</span>
              </label>
              <select
                id="df-country"
                disabled={loading}
                value={selectedCountry}
                onChange={(e) =>
                  setSelectedCountry(e.target.value as CanonicalCountry)
                }
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {VALID_COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label} ({c.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Consumer Category */}
            <div className="space-y-1.5">
              <label
                htmlFor="df-category"
                className="block text-xs font-semibold text-slate-800"
              >
                Consumer Category <span className="text-red-600">*</span>
              </label>
              <select
                id="df-category"
                disabled={loading}
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as CanonicalCategory)
                }
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {VALID_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {selectedCategoryObj && (
                <p className="text-xs text-slate-500">
                  {selectedCategoryObj.description}
                </p>
              )}
            </div>

            {/* Campaign / Audit Note */}
            <div className="space-y-1.5">
              <label
                htmlFor="df-notes"
                className="block text-xs font-semibold text-slate-800"
              >
                Campaign / Planning Note (Saved to History)
              </label>
              <input
                id="df-notes"
                type="text"
                disabled={loading}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Seasonal procurement and marketing budget..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full py-3 px-4 text-sm font-semibold text-white btn-aura-primary rounded-xl disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              {loading
                ? `Evaluating Demand & Trajectory (${(elapsedMs / 1000).toFixed(1)}s)...`
                : 'Run Full Demand Analysis'}
            </button>
          </form>

          {/* Tracked Keywords */}
          {selectedCategoryObj && (
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="font-semibold text-slate-900">
                Tracked Keywords in {selectedCategoryObj.label}:
              </div>
              <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl space-y-1.5">
                {selectedCategoryObj.keywordBatches.map((batch) => (
                  <div key={batch.theme} className="text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800">
                      {batch.theme}:
                    </span>{' '}
                    {batch.keywords.join(' · ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Why Combine Divergence & Forecast Box */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-600" />
              Why Combine Divergence &amp; Forecast?
            </div>
            <p className="leading-relaxed">
              <strong>Divergence</strong> assesses if current demand is genuine or
              merely media hype. The <strong>Forecast</strong> maps the actual
              week-by-week search index curve, showing exactly when peak interest
              will occur to coordinate ad timing and inventory orders.
            </p>
          </div>
        </div>

        {/* Right Column: Unified Output & Visual Trajectory */}
        <div ref={outputRef} className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-600 animate-spin" />
                  Evaluating Market Divergence &amp; Generating 8-Week Trajectory...
                </div>
                <div className="text-xs font-mono-tabular text-slate-500">
                  {(elapsedMs / 1000).toFixed(1)}s
                </div>
              </div>
              <div className="h-6 w-56 bg-slate-100 rounded animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              </div>
              <div className="h-72 w-full bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ) : forecast || divergence ? (
            <>
              {/* Executive Metrics Strip: 5 KPI Cards (Divergence + 8W Flow) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Metric 1: Divergence Score */}
                <div className="card-aura rounded-2xl p-3.5 space-y-1 relative overflow-hidden bg-gradient-to-b from-teal-50/40 to-white">
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                      scoreVal >= 0
                        ? 'from-emerald-400 to-teal-500'
                        : 'from-amber-400 to-rose-500'
                    }`}
                  />
                  <div className="text-[11px] font-semibold text-teal-800 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                    Divergence Score
                  </div>
                  <div
                    className={`text-xl font-bold font-mono-tabular ${
                      scoreVal >= 0 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {divergence ? (
                      <>
                        {scoreVal >= 0 ? '+' : ''}
                        {scoreVal.toFixed(3)}
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {scoreVal >= 0.2
                      ? 'Underserved Demand'
                      : scoreVal >= 0
                      ? 'Balanced Market'
                      : 'Media-Saturated'}
                  </div>
                </div>

                {/* Metric 2: 4W Historical Baseline */}
                <div className="card-aura rounded-2xl p-3.5 space-y-1 relative overflow-hidden bg-gradient-to-b from-indigo-50/30 to-white">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
                  <div className="text-[11px] font-semibold text-indigo-800 flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-indigo-600" />
                    4W Historical Avg
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono-tabular">
                    {hasHistorical ? meanHistorical.toFixed(2) : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono-tabular truncate">
                    {lastHistorical
                      ? `Latest: ${lastHistorical.search_interest.toFixed(
                          1
                        )} (${formatWeekDate(lastHistorical.week_date, 'short')})`
                      : 'Historical window'}
                  </div>
                </div>

                {/* Metric 3: 4W Forward Forecast Mean */}
                <div className="card-aura rounded-2xl p-3.5 space-y-1 relative overflow-hidden bg-gradient-to-b from-cyan-50/30 to-white">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
                  <div className="text-[11px] font-semibold text-sky-800 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
                    4W Forward Avg
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono-tabular">
                    {forecastPoints.length > 0 ? meanForecast.toFixed(2) : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono-tabular truncate">
                    {forecastPoints.length > 0
                      ? `${formatWeekDate(
                          forecastPoints[0].week_date,
                          'short'
                        )} ➔ ${formatWeekDate(
                          forecastPoints[forecastPoints.length - 1].week_date,
                          'short'
                        )}`
                      : 'Forward window'}
                  </div>
                </div>

                {/* Metric 4: Cross-Horizon Momentum */}
                <div className="card-aura rounded-2xl p-3.5 space-y-1 relative overflow-hidden bg-gradient-to-b from-slate-50/50 to-white">
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                      momentumShift >= 0
                        ? 'from-emerald-400 to-teal-500'
                        : 'from-amber-400 to-orange-500'
                    }`}
                  />
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                    Demand Shift
                  </div>
                  <div
                    className={`text-xl font-bold font-mono-tabular flex items-baseline gap-1 ${
                      momentumShift >= 0 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    <span>{momentumShift >= 0 ? '+' : ''}{momentumShift.toFixed(2)}</span>
                    <span className="text-[10px] font-medium text-slate-500">
                      ({momentumPct >= 0 ? '+' : ''}{momentumPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {momentumShift >= 0 ? 'Expanding Intent' : 'Softening Trend'}
                  </div>
                </div>

                {/* Metric 5: Peak Week */}
                <div className="card-aura rounded-2xl p-3.5 space-y-1 relative overflow-hidden bg-gradient-to-b from-teal-50/30 to-white col-span-2 sm:col-span-1">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-500" />
                  <div className="text-[11px] font-semibold text-teal-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    Peak Week
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono-tabular">
                    {peakPoint?.predicted_search_interest.toFixed(2) ?? '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono-tabular truncate">
                    {peakPoint
                      ? formatWeekDate(peakPoint.week_date, 'full')
                      : 'Forecast horizon'}
                  </div>
                </div>
              </div>

              {/* Unified Commercial Recommendation Banner */}
              <div className="card-aura rounded-2xl p-5 space-y-2 bg-gradient-to-r from-teal-50/50 via-white to-cyan-50/50 border border-cyan-200/80">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-cyan-300">
                    Comprehensive Demand Synthesis
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {formatEntityLabel(activeCountry)} · {formatEntityLabel(activeCategory)}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {divergence && scoreVal >= 0 ? (
                    <>
                      <strong>Underserved Market Balance:</strong> Shopper search interest is
                      running ahead of media coverage (Divergence score: <strong>+{scoreVal.toFixed(3)}</strong>).{' '}
                    </>
                  ) : divergence ? (
                    <>
                      <strong>Media-Saturated Warning:</strong> Press and media volume currently outpace
                      organic consumer search momentum (Divergence score: <strong>{scoreVal.toFixed(3)}</strong>).{' '}
                    </>
                  ) : null}

                  {hasHistorical && lastHistorical ? (
                    <>
                      Over the verified 4-week historical window (ending{' '}
                      <strong>{formatWeekDate(lastHistorical.week_date, 'standard')}</strong>), search interest
                      averaged <strong>{meanHistorical.toFixed(2)}</strong>. Looking ahead across the next 4 weeks,
                      the model projects demand to{' '}
                      <strong>
                        {momentumShift >= 0 ? 'accelerate to' : 'ease toward'} an average of{' '}
                        {meanForecast.toFixed(2)} ({momentumShift >= 0 ? '+' : ''}{momentumShift.toFixed(2)} pts shift)
                      </strong>
                      , reaching a projected peak of{' '}
                      <strong>{peakPoint?.predicted_search_interest.toFixed(2)}</strong> during the{' '}
                      <strong>{peakPoint ? formatWeekDate(peakPoint.week_date, 'full') : ''}</strong>.
                      {momentumShift >= 0
                        ? ' Recommended strategy: Pre-position regional stock and scale targeted digital campaigns 10–14 days prior to peak interest to maximize conversion rates.'
                        : ' Recommended strategy: Maintain lean inventory replenishment and focus promotions on converting existing high-intent shoppers before demand softens.'}
                    </>
                  ) : null}
                </p>
              </div>

              {/* SECTION: Divergence Spectrum & Strategic Breakdown (Visible in 'all' or 'divergence' view) */}
              {(activeTab === 'all' || activeTab === 'divergence') && divergence && (
                <div className="card-aura rounded-2xl p-6 space-y-5 relative overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                      scoreVal >= 0
                        ? 'from-emerald-400 via-teal-500 to-cyan-500'
                        : 'from-amber-400 via-orange-500 to-rose-500'
                    }`}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="text-xs text-teal-700 font-medium">
                        Market Balance &amp; Saturation Diagnostic
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        Demand vs. Hype Divergence Score:{' '}
                        <span
                          className={`font-mono-tabular ${
                            scoreVal >= 0 ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {scoreVal >= 0 ? '+' : ''}
                          {scoreVal.toFixed(4)}
                        </span>
                      </h3>
                    </div>
                    <div className="text-xs text-slate-500 font-mono-tabular">
                      Period: {formatEntityLabel(divergence.record_date)}
                    </div>
                  </div>

                  {/* Spectrum Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 font-mono-tabular">
                      <span className="text-amber-800 font-semibold">
                        -1.00 (Media Hype)
                      </span>
                      <span className="text-slate-600 font-semibold">
                        0.00 (Balanced)
                      </span>
                      <span className="text-emerald-800 font-semibold">
                        +1.00 (Underserved Demand)
                      </span>
                    </div>
                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                        style={{ left: `${zeroMarkerPercent}%` }}
                        title="Balanced Market (0.00)"
                      />
                      <div
                        className={`h-full transition-all ${
                          scoreVal >= 0 ? 'bg-emerald-600' : 'bg-amber-600'
                        }`}
                        style={{ width: `${gaugePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 3 Zones Guide */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        scoreVal < -0.05
                          ? 'bg-amber-100/70 border-amber-300 ring-2 ring-amber-400/40'
                          : 'bg-amber-50/50 border-amber-200/80'
                      }`}
                    >
                      <div className="font-semibold text-amber-900 flex items-center justify-between">
                        <span>-1.00 to -0.05</span>
                        {scoreVal < -0.05 && (
                          <span className="px-1.5 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-900">Media Hype Saturation</div>
                      <p className="text-slate-600 leading-relaxed">
                        PR chatter outpaces search momentum. Keep inventory disciplined and avoid broad awareness campaigns.
                      </p>
                    </div>

                    <div
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        scoreVal >= -0.05 && scoreVal <= 0.2
                          ? 'bg-slate-100/90 border-slate-300 ring-2 ring-slate-400/40'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="font-semibold text-slate-700 flex items-center justify-between">
                        <span>-0.05 to +0.20</span>
                        {scoreVal >= -0.05 && scoreVal <= 0.2 && (
                          <span className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-900">Balanced Market</div>
                      <p className="text-slate-600 leading-relaxed">
                        Consumer interest and media visibility move together. Maintain steady replenishment.
                      </p>
                    </div>

                    <div
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        scoreVal > 0.2
                          ? 'bg-emerald-100/70 border-emerald-300 ring-2 ring-emerald-400/40'
                          : 'bg-emerald-50/50 border-emerald-200/80'
                      }`}
                    >
                      <div className="font-semibold text-emerald-900 flex items-center justify-between">
                        <span>+0.20 to +1.00</span>
                        {scoreVal > 0.2 && (
                          <span className="px-1.5 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-900">Underserved Demand</div>
                      <p className="text-slate-600 leading-relaxed">
                        Shoppers are searching faster than media buzz. Prime market for paid search and product launches.
                      </p>
                    </div>
                  </div>

                  {/* Supporting Cluster Context */}
                  {(matchedOverall || matched4W) && (
                    <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                      <div className="font-semibold text-slate-900">
                        Supporting Segmentation Snapshot
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {matched4W && (
                          <>
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                              <div className="text-slate-500 text-[11px]">4W Search Level</div>
                              <div className="font-mono-tabular font-bold text-slate-900">
                                {matched4W.mean_search_interest.toFixed(2)}
                              </div>
                            </div>
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                              <div className="text-slate-500 text-[11px]">4W Media Volume</div>
                              <div className="font-mono-tabular font-bold text-slate-900">
                                {matched4W.mean_media_volume.toFixed(2)}
                              </div>
                            </div>
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                              <div className="text-slate-500 text-[11px]">4W Trend Slope</div>
                              <div className="font-mono-tabular font-bold text-slate-900">
                                {matched4W.search_interest_trend_slope >= 0 ? '+' : ''}
                                {matched4W.search_interest_trend_slope.toFixed(3)}
                              </div>
                            </div>
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                              <div className="text-slate-500 text-[11px]">4W Media Sentiment</div>
                              <div className="font-mono-tabular font-bold text-slate-900">
                                {matched4W.mean_net_sentiment.toFixed(2)}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Cluster Report Insights */}
                      {(matchedOverallReportCluster || matched4WReportCluster) && (
                        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {matchedOverallReportCluster && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                              <div className="font-semibold text-slate-900">
                                3+ Year Segment: {matchedOverallReportCluster.clusterName}
                              </div>
                              <p className="text-slate-600 leading-relaxed">
                                {matchedOverallReportCluster.businessInterpretation ||
                                  matchedOverallReportCluster.keyInsightsSummary}
                              </p>
                            </div>
                          )}
                          {matched4WReportCluster && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                              <div className="font-semibold text-slate-900">
                                4-Week Profile: {matched4WReportCluster.clusterName}
                              </div>
                              <p className="text-slate-600 leading-relaxed">
                                {matched4WReportCluster.businessInterpretation ||
                                  matched4WReportCluster.keyInsightsSummary}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: 8-Week Trajectory Chart (Visible in 'all' or 'forecast' view) */}
              {(activeTab === 'all' || activeTab === 'forecast') && forecast && (
                <div className="card-aura rounded-2xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                          4W Actuals (Observed)
                        </span>
                        <span className="text-slate-400 text-xs">➔</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800">
                          4W Forecast (Projection)
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        8-Week Search Interest Trajectory:{' '}
                        {formatEntityLabel(forecast.country_name)} ·{' '}
                        {formatEntityLabel(forecast.category)}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Weekly Search Index (0–100 Scale) · Seamless transition from historical ground truth to forward projection
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-indigo-700 font-medium">
                        <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
                        Historical Actual
                      </div>
                      <div className="flex items-center gap-1.5 text-cyan-700 font-medium">
                        <span className="w-3 h-1 border-t-2 border-dashed border-cyan-600 inline-block" />
                        Projection
                      </div>
                    </div>
                  </div>

                  {/* Chart using readable dates (NO W+1/W-1) */}
                  <div className="h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={combinedTimeline}
                        margin={{ top: 20, right: 25, left: 0, bottom: 10 }}
                      >
                        <defs>
                          <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
                          </linearGradient>

                          <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />

                        <XAxis
                          dataKey="week_date"
                          tick={{ fontSize: 11, fill: '#475569' }}
                          tickFormatter={(val: string) => formatWeekDate(val, 'short')}
                        />

                        <YAxis
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 11, fill: '#475569' }}
                        />

                        <Tooltip content={<ChartCustomTooltip />} />

                        {lastHistorical && (
                          <ReferenceLine
                            x={lastHistorical.week_date}
                            stroke="#94A3B8"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                              value: 'T=0 Forecast Boundary',
                              fill: '#64748B',
                              fontSize: 11,
                              position: 'top',
                              offset: 10,
                            }}
                          />
                        )}

                        {/* Historical Curve */}
                        <Area
                          type="monotone"
                          dataKey="actualSearchInterest"
                          name="Historical Actuals"
                          stroke="#4F46E5"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#histFill)"
                          connectNulls={false}
                          dot={{ r: 4, fill: '#4F46E5', stroke: '#FFFFFF', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: '#4F46E5' }}
                        />

                        {/* Forecast Curve */}
                        <Area
                          type="monotone"
                          dataKey="predictedSearchInterest"
                          name="Projection"
                          stroke="#0284C7"
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          fillOpacity={1}
                          fill="url(#forecastFill)"
                          connectNulls={false}
                          dot={{ r: 4, fill: '#0284C7', stroke: '#FFFFFF', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: '#0284C7' }}
                        />

                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => (
                            <span className="text-xs font-medium text-slate-700">
                              {value === 'Historical Actuals'
                                ? 'Verified 4-Week Ground Truth'
                                : 'Projected 4-Week Outlook'}
                            </span>
                          )}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Chronological 8-Week Schedule Table (NO W+1/W-1; Uses week dates) */}
              {(activeTab === 'all' || activeTab === 'forecast') && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Chronological Demand Schedule: Historical Actuals &amp; Forward Outlook
                      </h3>
                      <p className="text-xs text-slate-500">
                        Complete 8-week timeline formatted with exact week dates
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setTableFilter('all')}
                        className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                          tableFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All 8 Weeks
                      </button>
                      <button
                        type="button"
                        onClick={() => setTableFilter('forecast')}
                        className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                          tableFilter === 'forecast'
                            ? 'bg-white text-cyan-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Forecast Only (4W)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTableFilter('historical')}
                        className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                          tableFilter === 'historical'
                            ? 'bg-white text-indigo-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Historical Only (4W)
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                          <th className="py-2.5 px-4 font-semibold">Timeline Phase</th>
                          <th className="py-2.5 px-4 font-semibold">Week Period</th>
                          <th className="py-2.5 px-4 font-semibold text-right">
                            Search Interest Index (0–100)
                          </th>
                          <th className="py-2.5 px-4 font-semibold text-right">
                            Week-over-Week Shift
                          </th>
                          <th className="py-2.5 px-4 font-semibold text-right">
                            Vs 4W Baseline
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTableRows.map((row) => {
                          const isHist = row.stage === 'historical';
                          const val =
                            row.actualValue !== null && row.actualValue !== undefined
                              ? row.actualValue
                              : row.forecastValue;
                          const varianceVsBaseline =
                            hasHistorical && val !== null && val !== undefined
                              ? val - meanHistorical
                              : 0;

                          return (
                            <tr
                              key={row.week_date + row.stage}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                row.isStitch ? 'bg-indigo-50/20' : ''
                              }`}
                            >
                              <td className="py-2.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                    isHist
                                      ? 'bg-indigo-100/80 text-indigo-800 border border-indigo-200/60'
                                      : 'bg-cyan-100/80 text-cyan-800 border border-cyan-200/60'
                                  }`}
                                >
                                  {isHist ? (
                                    <>
                                      <History className="w-3 h-3 text-indigo-600" />
                                      Historical Actual
                                    </>
                                  ) : (
                                    <>
                                      <TrendingUp className="w-3 h-3 text-cyan-600" />
                                      ML Forecast
                                    </>
                                  )}
                                </span>
                              </td>

                              <td className="py-2.5 px-4 font-mono-tabular font-semibold text-slate-900">
                                {formatWeekDate(row.week_date, 'full')}
                              </td>

                              <td className="py-2.5 px-4 text-right font-mono-tabular font-bold text-slate-900 text-sm">
                                {typeof val === 'number' ? val.toFixed(2) : '-'}
                              </td>

                              <td
                                className={`py-2.5 px-4 text-right font-mono-tabular font-medium ${
                                  row.stepDelta === null
                                    ? 'text-slate-400'
                                    : row.stepDelta >= 0
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {row.stepDelta === null
                                  ? '—'
                                  : `${row.stepDelta >= 0 ? '+' : ''}${row.stepDelta.toFixed(
                                      2
                                    )} pts`}
                              </td>

                              <td
                                className={`py-2.5 px-4 text-right font-mono-tabular font-medium ${
                                  hasHistorical
                                    ? varianceVsBaseline >= 0
                                      ? 'text-emerald-700'
                                      : 'text-amber-700'
                                    : 'text-slate-400'
                                }`}
                              >
                                {hasHistorical
                                  ? `${
                                      varianceVsBaseline >= 0 ? '+' : ''
                                    }${varianceVsBaseline.toFixed(2)} pts`
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card-aura rounded-2xl p-10 text-center space-y-3 border-dashed border-cyan-200 bg-gradient-to-br from-white via-cyan-50/20 to-indigo-50/20">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mx-auto">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="text-base font-bold text-slate-900">
                Ready for Comprehensive Market Demand Analysis
              </div>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Select your Target Country and Consumer Category on the left, then click{' '}
                <strong>&ldquo;Run Full Demand Analysis&rdquo;</strong>. The system will concurrently
                compute the Demand vs. Hype Divergence Score alongside the full 8-week continuous
                trajectory (4-week historical ground truth + 4-week forward forecast).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
