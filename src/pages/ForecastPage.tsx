import React, { useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
  ForecastResponse,
  PipelineExecutionMeta,
} from '../types/models';

export const ForecastPage: React.FC = () => {
  const { profile, logPrediction } = useAuth();

  const [selectedCountry, setSelectedCountry] =
    useState<CanonicalCountry>('India');
  const [selectedCategory, setSelectedCategory] =
    useState<CanonicalCategory>('Fashion_Beauty');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<PipelineErrorState | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
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

  const handleForecast = async (e?: React.FormEvent) => {
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
        API_ENDPOINTS.FORECAST_SEARCH_INTEREST
      );

      // Step 3: Strict Payload Construction (only country_name and category; notes excluded)
      const payload = constructPredictionPayload(validatedInput);

      // Step 4–7: API Request -> Backend -> ML Prediction -> Validated JSON Response
      const res = await nexusDemandApi.forecastSearchInterest(
        payload,
        (meta) => {
          setPipelineMeta(meta);
        }
      );

      // Step 8: Frontend Result
      setForecast(res);

      const pts = res.forecast_points || [];
      const meanVal =
        pts.length > 0
          ? pts.reduce((acc, p) => acc + p.predicted_search_interest, 0) /
            pts.length
          : 0;
      const horizonLabel =
        pts.length > 0
          ? `${pts[0].week_date} → ${pts[pts.length - 1].week_date}`
          : '4-Week Horizon';

      await logPrediction({
        modelType: 'forecast',
        modelDisplayName: MODEL_SPECIFICATIONS.forecast.name,
        countryName: res.country_name,
        category: res.category,
        summaryValue: `4W Avg: ${meanVal.toFixed(2)} (Wk4: ${
          pts[pts.length - 1]?.predicted_search_interest.toFixed(2) ?? '-'
        })`,
        numericResult: Number(meanVal.toFixed(4)),
        recordDate: horizonLabel,
        predictionStatus: 'success',
        notes,
      });
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error
          ? err.message
          : 'Failed to generate 4-Week Search Interest forecast.';

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
          modelDisplayName: MODEL_SPECIFICATIONS.forecast.name,
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

  const points = forecast?.forecast_points || [];
  const wk1 = points[0]?.predicted_search_interest ?? 0;
  const wk4 = points[points.length - 1]?.predicted_search_interest ?? 0;
  const netDelta = wk4 - wk1;
  const meanForecast =
    points.length > 0
      ? points.reduce((s, p) => s + p.predicted_search_interest, 0) /
        points.length
      : 0;
  const peakPoint =
    points.length > 0
      ? points.reduce((best, p) =>
          p.predicted_search_interest > best.predicted_search_interest
            ? p
            : best
        )
      : null;

  const selectedCategoryObj = VALID_CATEGORIES.find(
    (c) => c.value === selectedCategory
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>4-Week Forward Demand Outlook</span>
          <span aria-hidden="true">·</span>
          <span>0–100 Consumer Search Index</span>
          <span aria-hidden="true">·</span>
          <span>14 Countries × 3 Categories</span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          4-Week Consumer Search Interest Forecast
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Projects weekly consumer search interest (0–100 popularity scale) over
          the upcoming 4 weeks for any supported country and category. Use this
          outlook to prepare regional warehouse inventory ahead of demand surges
          and schedule marketing campaigns to hit peak shopper interest.
        </p>
      </div>

      {/* Status & Alert Banner */}
      <PipelineFlowStatus
        loading={loading}
        elapsedMs={elapsedMs}
        isColdStart={elapsedMs >= COLD_START_THRESHOLD_MS}
        error={error}
        meta={pipelineMeta}
        onRetry={() => handleForecast()}
        modelLabel="4-Week Search Interest Forecast"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Understandable Forecast Controls */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              Select Market to Forecast
            </h2>
            <p className="text-xs text-slate-500">
              Choose a target country and consumer category to generate a
              week-by-week 4-week demand outlook.
            </p>
          </div>

          <form onSubmit={handleForecast} className="space-y-5" noValidate>
            {/* Categorical Input 1: Target Country Dropdown */}
            <div className="space-y-1.5">
              <label
                htmlFor="fc-country"
                className="block text-xs font-semibold text-slate-800"
              >
                Target Country <span className="text-red-600">*</span>
              </label>
              <select
                id="fc-country"
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

            {/* Categorical Input 2: Consumer Category Dropdown */}
            <div className="space-y-1.5">
              <label
                htmlFor="fc-category"
                className="block text-xs font-semibold text-slate-800"
              >
                Consumer Category <span className="text-red-600">*</span>
              </label>
              <select
                id="fc-category"
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

            <div className="space-y-1.5">
              <label
                htmlFor="fc-notes"
                className="block text-xs font-semibold text-slate-800"
              >
                Campaign / Inventory Note (Optional — Saved to History)
              </label>
              <input
                id="fc-notes"
                type="text"
                disabled={loading}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Pre-holiday inventory planning..."
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
                ? `Building 4-Week Outlook (${(elapsedMs / 1000).toFixed(
                    1
                  )}s)...`
                : 'Generate 4-Week Forecast'}
            </button>
          </form>

          {/* How to Use This Forecast */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="font-semibold text-slate-900">
              How to Use This 4-Week Outlook
            </div>
            <p className="leading-relaxed">
              Compare <strong>Week +1</strong> against <strong>Week +4</strong>{' '}
              and note the <strong>Peak Week</strong>. When search interest is
              projected to climb, move stock into local fulfillment centers
              early and schedule ad campaigns to launch just before the peak
              week.
            </p>
          </div>
        </div>

        {/* Right Column: Forecast Chart & Tabular Trajectory */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-700">
                  Projecting Weekly Search Interest Across the Next 4 Weeks...
                </div>
                <div className="text-xs font-mono-tabular text-slate-500">
                  {(elapsedMs / 1000).toFixed(1)}s
                </div>
              </div>
              <div className="h-6 w-56 bg-slate-100 rounded animate-pulse" />
              <div className="h-64 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-32 w-full bg-slate-100 rounded animate-pulse" />
            </div>
          ) : forecast ? (
            <>
              {/* Summary Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-500">Week +1 Outlook</div>
                  <div className="text-2xl font-semibold text-slate-900 font-mono-tabular">
                    {wk1.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 font-mono-tabular">
                    {points[0]?.week_date}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-500">Week +4 Outlook</div>
                  <div className="text-2xl font-semibold text-slate-900 font-mono-tabular">
                    {wk4.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 font-mono-tabular">
                    {points[points.length - 1]?.week_date}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-500">4-Week Average</div>
                  <div className="text-2xl font-semibold text-slate-900 font-mono-tabular">
                    {meanForecast.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Peak Week: {peakPoint?.week_date}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-500">4-Week Net Shift</div>
                  <div
                    className={`text-2xl font-semibold font-mono-tabular ${
                      netDelta >= 0 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {netDelta >= 0 ? '+' : ''}
                    {netDelta.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {netDelta >= 0 ? 'Expanding Demand' : 'Softening Demand'}
                  </div>
                </div>
              </div>

              {/* Commercial Action Recommendation Banner */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
                <div className="text-xs font-semibold text-slate-900">
                  Commercial Planning Recommendation for{' '}
                  {formatEntityLabel(forecast.country_name)} ·{' '}
                  {formatEntityLabel(forecast.category)}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {netDelta >= 0
                    ? `Consumer search interest is projected to grow by +${netDelta.toFixed(
                        2
                      )} points over the next 4 weeks, peaking during the week of ${
                        peakPoint?.week_date
                      }. Ensure regional inventory is stocked ahead of ${
                        peakPoint?.week_date
                      } and align promotional campaigns to capture rising shopper intent.`
                    : `Consumer search interest is projected to ease by ${netDelta.toFixed(
                        2
                      )} points over the next 4 weeks, with the strongest week occurring on ${
                        peakPoint?.week_date
                      }. Concentrate promotional launches early in the window and maintain lean inventory replenishment afterward.`}
                </p>
              </div>

              {/* Recharts Trajectory Chart */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-emerald-700 font-medium">
                      4-Week Demand Outlook Ready
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Projected Search Interest:{' '}
                      {formatEntityLabel(forecast.country_name)} ·{' '}
                      {formatEntityLabel(forecast.category)}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Weekly Consumer Search Interest Index (0–100 Scale)
                    </p>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={points}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="forecastFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#0F172A"
                            stopOpacity={0.18}
                          />
                          <stop
                            offset="95%"
                            stopColor="#0F172A"
                            stopOpacity={0.01}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="week_date"
                        tick={{ fontSize: 12, fill: '#475569' }}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 12, fill: '#475569' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#1E293B',
                          color: '#F8FAFC',
                          fontSize: '12px',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted_search_interest"
                        name="Projected Search Interest"
                        stroke="#0F172A"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#forecastFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly Forecast Points Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Week-by-Week Demand Schedule
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                        <th className="py-2.5 px-4 font-medium">Forecast Week</th>
                        <th className="py-2.5 px-4 font-medium">
                          Week Starting Date
                        </th>
                        <th className="py-2.5 px-4 font-medium text-right">
                          Projected Search Interest (0–100)
                        </th>
                        <th className="py-2.5 px-4 font-medium text-right">
                          Week-over-Week Shift
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {points.map((pt, idx) => {
                        const prev =
                          idx > 0
                            ? points[idx - 1].predicted_search_interest
                            : pt.predicted_search_interest;
                        const stepDelta =
                          idx === 0 ? 0 : pt.predicted_search_interest - prev;
                        return (
                          <tr key={pt.week_date} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-mono-tabular text-slate-600">
                              Week +{idx + 1}
                            </td>
                            <td className="py-2.5 px-4 font-mono-tabular font-medium text-slate-900">
                              {pt.week_date}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono-tabular font-semibold text-slate-900">
                              {pt.predicted_search_interest.toFixed(2)}
                            </td>
                            <td
                              className={`py-2.5 px-4 text-right font-mono-tabular ${
                                idx === 0
                                  ? 'text-slate-400'
                                  : stepDelta >= 0
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {idx === 0
                                ? 'Starting Forecast Week'
                                : `${stepDelta >= 0 ? '+' : ''}${stepDelta.toFixed(
                                    2
                                  )}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
              <div className="text-sm font-semibold text-slate-900">
                Ready to Forecast Next 4 Weeks of Search Interest
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Choose a Target Country and Consumer Category on the left and
                click &ldquo;Generate 4-Week Forecast&rdquo; to view the
                week-by-week shopper demand outlook.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
