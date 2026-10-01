import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PipelineErrorState,
  PipelineFlowStatus,
} from '../components/PipelineFlowStatus';
import {
  API_ENDPOINTS,
  FEATURE_DESCRIPTIONS,
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
  MarkdownReportResponse,
  PipelineExecutionMeta,
  SegmentationRecord,
} from '../types/models';
import { parseSegmentationReport } from '../utils/reportParser';

interface DivergencePageProps {
  overallClusters: SegmentationRecord[];
  fourWeekClusters: SegmentationRecord[];
  overallReport?: MarkdownReportResponse | null;
  fourWeekReport?: MarkdownReportResponse | null;
}

export const DivergencePage: React.FC<DivergencePageProps> = ({
  overallClusters,
  fourWeekClusters,
  overallReport = null,
  fourWeekReport = null,
}) => {
  const { profile, logPrediction } = useAuth();

  const [selectedCountry, setSelectedCountry] =
    useState<CanonicalCountry>('United_States');
  const [selectedCategory, setSelectedCategory] =
    useState<CanonicalCategory>('Fashion_Beauty');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<PipelineErrorState | null>(null);
  const [result, setResult] = useState<DivergenceResponse | null>(null);
  const [pipelineMeta, setPipelineMeta] =
    useState<PipelineExecutionMeta | null>(null);

  const timerRef = useRef<number | null>(null);

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

  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;

    setLoading(true);
    setElapsedMs(0);
    setError(null);

    const startTs = performance.now();
    timerRef.current = window.setInterval(() => {
      setElapsedMs(Math.round(performance.now() - startTs));
    }, 200);

    try {
      // Step 1 & 2: User Input -> Explicit Client Validation
      const validatedInput = validateRequiredMarketInput(
        {
          country_name: selectedCountry,
          category: selectedCategory,
        },
        API_ENDPOINTS.PREDICT_DIVERGENCE
      );

      // Step 3: Payload Construction (strictly country_name and category; notes is excluded)
      const payload = constructPredictionPayload(validatedInput);

      // Step 4–7: API Request -> Backend -> ML Prediction -> Validated JSON Response
      const res = await nexusDemandApi.predictDivergence(payload, (meta) => {
        setPipelineMeta(meta);
      });

      // Step 8: Frontend Result
      setResult(res);

      const scoreFormatted =
        res.predicted_divergence_score >= 0
          ? `+${res.predicted_divergence_score.toFixed(4)} (Underserved Demand)`
          : `${res.predicted_divergence_score.toFixed(4)} (Over-Hyped Market)`;

      await logPrediction({
        modelType: 'divergence',
        modelDisplayName: MODEL_SPECIFICATIONS.divergence.name,
        countryName: res.country_name,
        category: res.category,
        summaryValue: scoreFormatted,
        numericResult: res.predicted_divergence_score,
        recordDate: formatEntityLabel(res.record_date),
        predictionStatus: 'success',
        notes,
      });
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error
          ? err.message
          : 'Failed to evaluate Demand vs. Hype score.';

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
          endpoint: API_ENDPOINTS.PREDICT_DIVERGENCE,
        });
      }

      try {
        await logPrediction({
          modelType: 'divergence',
          modelDisplayName: MODEL_SPECIFICATIONS.divergence.name,
          countryName: selectedCountry,
          category: selectedCategory,
          summaryValue: `Error: ${errMessage.slice(0, 140)}`,
          numericResult: 0,
          recordDate: new Date().toISOString().slice(0, 10),
          predictionStatus: 'error',
          notes,
        });
      } catch {
        // Non-blocking audit log on failure
      }
    } finally {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setLoading(false);
    }
  };

  // Match baseline cluster context for the selected country & category
  const activeCountry =
    (result?.country_name as CanonicalCountry) || selectedCountry;
  const activeCategory =
    (result?.category as CanonicalCategory) || selectedCategory;

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

  // Compute gauge percentage across observed historical range [-0.5514, +1.0]
  const minRange = MODEL_SPECIFICATIONS.divergence.metrics.targetRange[0];
  const maxRange = MODEL_SPECIFICATIONS.divergence.metrics.targetRange[1];
  const scoreVal = result?.predicted_divergence_score ?? 0;
  const clampedScore = Math.max(minRange, Math.min(maxRange, scoreVal));
  const gaugePercent =
    ((clampedScore - minRange) / (maxRange - minRange)) * 100;
  const zeroMarkerPercent = ((0 - minRange) / (maxRange - minRange)) * 100;

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

  const selectedCategoryObj = VALID_CATEGORIES.find(
    (c) => c.value === selectedCategory
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-8">
      {/* Page Title & Metadata */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Opportunity &amp; Saturation Analysis</span>
          <span aria-hidden="true">·</span>
          <span>Scale: -1.00 to +1.00</span>
          <span aria-hidden="true">·</span>
          <span>14 Countries × 3 Categories</span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Demand vs. Hype Divergence Score
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Reveals whether a country and consumer lifestyle category is
          experiencing genuine, underserved shopper demand or excessive media
          buzz. Positive scores highlight high-return opportunities to invest in
          search marketing and inventory; negative scores warn against paying for
          over-hyped media noise.
        </p>
      </div>

      {/* Status & Alert Banner */}
      <PipelineFlowStatus
        loading={loading}
        elapsedMs={elapsedMs}
        isColdStart={elapsedMs >= COLD_START_THRESHOLD_MS}
        error={error}
        meta={pipelineMeta}
        onRetry={() => handlePredict()}
        modelLabel="Demand vs. Hype Divergence Score"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Understandable UI Controls */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              Select a Market to Evaluate
            </h2>
            <p className="text-xs text-slate-500">
              Choose a target country and consumer category to check the current
              balance between buyer demand and media coverage.
            </p>
          </div>

          {/* Preset Quick Selectors */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">
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
                  className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 ${
                    selectedCountry === preset.country &&
                    selectedCategory === preset.category
                      ? 'bg-slate-900 text-white border-slate-900 font-medium'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset.tag}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handlePredict} className="space-y-5" noValidate>
            {/* Categorical Input 1: Target Country Dropdown */}
            <div className="space-y-1.5">
              <label
                htmlFor="div-country"
                className="block text-xs font-semibold text-slate-800"
              >
                Target Country <span className="text-red-600">*</span>
              </label>
              <select
                id="div-country"
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
              <p className="text-xs text-slate-500">
                Choose one of the 14 global markets tracked across the platform.
              </p>
            </div>

            {/* Categorical Input 2: Consumer Category Dropdown */}
            <div className="space-y-1.5">
              <label
                htmlFor="div-category"
                className="block text-xs font-semibold text-slate-800"
              >
                Consumer Category <span className="text-red-600">*</span>
              </label>
              <select
                id="div-category"
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
                <div className="pt-1.5 space-y-1.5 text-xs">
                  <p className="text-slate-500">
                    {selectedCategoryObj.description}
                  </p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="font-semibold text-slate-800">
                      Tracked Keywords in {selectedCategoryObj.label}:
                    </div>
                    {selectedCategoryObj.keywordBatches.map((batch) => (
                      <div key={batch.theme} className="text-slate-600">
                        <span className="font-medium text-slate-800">
                          {batch.theme}:
                        </span>{' '}
                        {batch.keywords.join(' · ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Optional Business Note */}
            <div className="space-y-1.5">
              <label
                htmlFor="div-notes"
                className="block text-xs font-semibold text-slate-800"
              >
                Planning Note (Optional — Saved to Your History)
              </label>
              <input
                id="div-notes"
                type="text"
                disabled={loading}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Q4 campaign budget review..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full py-2.5 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
            >
              {loading
                ? `Analyzing Market Balance (${(elapsedMs / 1000).toFixed(
                    1
                  )}s)...`
                : 'Check Demand vs. Hype Score'}
            </button>
          </form>

          {/* Practical Score Reference Box */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="font-semibold text-slate-900">
              Quick Score Guide (-1.00 to +1.00 Scale)
            </div>
            <p className="leading-relaxed">
              The Divergence Score spans <strong>-1.00 to +1.00</strong>.
              Positive scores indicate that shopper search demand is ahead of
              media coverage; negative scores signal that media hype is ahead of
              actual buyer search activity.
            </p>
          </div>
        </div>

        {/* Right Column: Prediction Output & Business Guidance */}
        <div className="lg:col-span-7 space-y-6">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-700">
                  Evaluating Consumer Demand vs. Media Coverage...
                </div>
                <div className="text-xs font-mono-tabular text-slate-500">
                  {(elapsedMs / 1000).toFixed(1)}s
                </div>
              </div>
              <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
              <div className="h-14 w-64 bg-slate-100 rounded animate-pulse" />
              <div className="h-24 w-full bg-slate-100 rounded animate-pulse" />
            </div>
          ) : result ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs text-emerald-700 font-medium">
                    Market Balance Analysis Complete
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {formatEntityLabel(result.country_name)} ·{' '}
                    {formatEntityLabel(result.category)}
                  </h3>
                </div>
                <div className="text-xs text-slate-500 font-mono-tabular">
                  Period: {formatEntityLabel(result.record_date)}
                </div>
              </div>

              {/* Headline Score & Strategic Verdict */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">
                    Demand vs. Hype Divergence Score
                  </div>
                  <div
                    className={`text-4xl font-semibold font-mono-tabular ${
                      result.predicted_divergence_score >= 0
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {result.predicted_divergence_score >= 0 ? '+' : ''}
                    {result.predicted_divergence_score.toFixed(4)}
                  </div>
                  <div className="text-xs text-slate-500 font-mono-tabular">
                    Scale: -1.00 (Media Hype) to +1.00 (Underserved Demand)
                  </div>
                </div>

                <div className="border-l-2 border-slate-900 pl-4 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-900">
                    {result.predicted_divergence_score >= 0.2
                      ? 'Strong Underserved Consumer Demand'
                      : result.predicted_divergence_score >= 0
                      ? 'Healthy Demand-Led Market Balance'
                      : 'Over-Hyped / Media-Saturated Market'}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {result.predicted_divergence_score >= 0
                      ? 'Consumers are actively searching for products in this category faster than media coverage is growing. Recommended action: prioritize paid search, product availability, and regional marketing.'
                      : 'News and media chatter currently exceed organic shopper search momentum. Recommended action: avoid expensive broad-awareness ad campaigns and keep inventory commitments disciplined.'}
                  </p>
                </div>
              </div>

              {/* Divergence Spectrum Bar */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-slate-500 font-mono-tabular">
                  <span>-1.00 (Media Hype)</span>
                  <span>0.00 (Balanced)</span>
                  <span>+1.00 (Underserved Demand)</span>
                </div>
                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                    style={{ left: `${zeroMarkerPercent}%` }}
                    title="Balanced Market (0.00)"
                  />
                  <div
                    className={`h-full transition-all ${
                      result.predicted_divergence_score >= 0
                        ? 'bg-emerald-600'
                        : 'bg-amber-600'
                    }`}
                    style={{ width: `${gaugePercent}%` }}
                  />
                </div>
              </div>

              {/* Cross-Referenced Market Context */}
              {(matchedOverall || matched4W) && (
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="text-xs font-semibold text-slate-900">
                    Supporting Market Snapshot
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    {matched4W && (
                      <>
                        <div>
                          <div className="text-slate-500">
                            4-Week Search Interest
                          </div>
                          <div className="font-mono-tabular font-semibold text-slate-900">
                            {matched4W.mean_search_interest.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">
                            4-Week Media Coverage
                          </div>
                          <div className="font-mono-tabular font-semibold text-slate-900">
                            {matched4W.mean_media_volume.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">
                            4-Week Demand Trend
                          </div>
                          <div className="font-mono-tabular font-semibold text-slate-900">
                            {matched4W.search_interest_trend_slope >= 0
                              ? '+'
                              : ''}
                            {matched4W.search_interest_trend_slope.toFixed(3)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">
                            4-Week Media Sentiment
                          </div>
                          <div className="font-mono-tabular font-semibold text-slate-900">
                            {matched4W.mean_net_sentiment.toFixed(2)}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                    {matchedOverall?.Cluster_Name && (
                      <span>
                        3+ Year Market Group:{' '}
                        <strong className="text-slate-900">
                          {matchedOverallReportCluster?.clusterName ||
                            matchedOverall.Cluster_Name}
                        </strong>
                      </span>
                    )}
                    {matched4W?.Cluster_Name && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          Recent 4-Week Profile:{' '}
                          <strong className="text-slate-900">
                            {matched4WReportCluster?.clusterName ||
                              matched4W.Cluster_Name}
                          </strong>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Weekly Report Insights for This Market's Assigned Clusters */}
                  {(matchedOverallReportCluster || matched4WReportCluster) && (
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {matchedOverallReportCluster && (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                          <div className="font-semibold text-slate-900">
                            3+ Year Report Insight (Cluster #
                            {matchedOverallReportCluster.clusterLabel}:{' '}
                            {matchedOverallReportCluster.clusterName})
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            {matchedOverallReportCluster.businessInterpretation ||
                              matchedOverallReportCluster.keyInsightsSummary}
                          </p>
                          {matchedOverallReportCluster.businessUseCase && (
                            <p className="text-slate-700 leading-relaxed">
                              <strong>Use Case:</strong>{' '}
                              {matchedOverallReportCluster.businessUseCase}
                            </p>
                          )}
                        </div>
                      )}

                      {matched4WReportCluster && (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                          <div className="font-semibold text-slate-900">
                            4-Week Report Insight (Cluster #
                            {matched4WReportCluster.clusterLabel}:{' '}
                            {matched4WReportCluster.clusterName})
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            {matched4WReportCluster.businessInterpretation ||
                              matched4WReportCluster.keyInsightsSummary}
                          </p>
                          {matched4WReportCluster.businessUseCase && (
                            <p className="text-slate-700 leading-relaxed">
                              <strong>Use Case:</strong>{' '}
                              {matched4WReportCluster.businessUseCase}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
              <div className="text-sm font-semibold text-slate-900">
                Ready to Evaluate Market Balance
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Select a Target Country and Consumer Category on the left and
                click &ldquo;Check Demand vs. Hype Score&rdquo; to see whether
                consumer demand is underserved or over-hyped.
              </p>
            </div>
          )}

          {/* Understandable Explanation of Market Factors Considered */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">
                What Goes Into This Score?
              </h3>
              <p className="text-xs text-slate-500">
                When you choose a country and category, the platform evaluates
                recent shopper search momentum, news coverage volume, media
                sentiment, public holidays, and local economic conditions:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                ...MODEL_SPECIFICATIONS.divergence.scaledNumericalFeatures,
                ...MODEL_SPECIFICATIONS.divergence.unscaledNumericalFeatures,
              ].map((featKey) => {
                const info = FEATURE_DESCRIPTIONS[featKey];
                return (
                  <div
                    key={featKey}
                    className="p-3 border border-slate-100 bg-slate-50/60 rounded-lg space-y-0.5"
                  >
                    <div className="font-semibold text-slate-900">
                      {info?.label || formatEntityLabel(featKey)}
                    </div>
                    <div className="text-slate-500">
                      {info?.description || 'Market indicator'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
