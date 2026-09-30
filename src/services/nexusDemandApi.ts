import {
  API_BASE_URL,
  API_ENDPOINTS,
  VALID_CATEGORIES,
  VALID_COUNTRIES,
} from '../config/api';
import {
  CanonicalCategory,
  CanonicalCountry,
  DivergenceRequest,
  DivergenceResponse,
  ForecastRequest,
  ForecastResponse,
  HealthResponse,
  MarkdownReportResponse,
  MlErrorCategory,
  PipelineExecutionMeta,
  SegmentationRecord,
  TableDataResponse,
  WeeklyForecastPoint,
} from '../types/models';

const CANONICAL_COUNTRY_SET = new Set<string>(
  VALID_COUNTRIES.map((c) => c.value)
);
const CANONICAL_CATEGORY_SET = new Set<string>(
  VALID_CATEGORIES.map((c) => c.value)
);

export const COLD_START_THRESHOLD_MS = 3500;

export class MlPipelineError extends Error {
  public readonly category: MlErrorCategory;
  public readonly statusCode?: number;
  public readonly endpoint: string;

  constructor(
    category: MlErrorCategory,
    message: string,
    endpoint: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'MlPipelineError';
    this.category = category;
    this.endpoint = endpoint;
    this.statusCode = statusCode;
  }
}

/**
 * Step 2: Client Validation for POST /predict/divergence and POST /forecast/search-interest.
 * Verifies required fields are present and match canonical training values.
 */
export function validateRequiredMarketInput(
  rawInput: { country_name?: unknown; category?: unknown },
  endpoint: string
): { country_name: CanonicalCountry; category: CanonicalCategory } {
  if (!rawInput || typeof rawInput !== 'object') {
    throw new MlPipelineError(
      'validation_error',
      'Input payload must be a valid object containing country_name and category.',
      endpoint
    );
  }

  const { country_name, category } = rawInput;

  if (typeof country_name !== 'string' || country_name.trim() === '') {
    throw new MlPipelineError(
      'validation_error',
      'Target Country (country_name) is required and cannot be empty.',
      endpoint
    );
  }

  if (!CANONICAL_COUNTRY_SET.has(country_name)) {
    throw new MlPipelineError(
      'validation_error',
      `Invalid Target Country "${country_name}". Must be one of the 14 canonical countries trained in the ML pipeline.`,
      endpoint
    );
  }

  if (typeof category !== 'string' || category.trim() === '') {
    throw new MlPipelineError(
      'validation_error',
      'Consumer Category (category) is required and cannot be empty.',
      endpoint
    );
  }

  if (!CANONICAL_CATEGORY_SET.has(category)) {
    throw new MlPipelineError(
      'validation_error',
      `Invalid Consumer Category "${category}". Must be one of: Fashion_Beauty, Fitness_Wearables, Nutrition_Diets.`,
      endpoint
    );
  }

  return {
    country_name: country_name as CanonicalCountry,
    category: category as CanonicalCategory,
  };
}

/**
 * Step 2: Client Validation for optional query parameters on GET /clusters/* endpoints.
 */
export function validateOptionalSegmentationFilter(
  params:
    | {
        country_name?: CanonicalCountry | '';
        category?: CanonicalCategory | '';
      }
    | undefined,
  endpoint: string
): { country_name?: CanonicalCountry; category?: CanonicalCategory } {
  if (!params) return {};

  const validated: {
    country_name?: CanonicalCountry;
    category?: CanonicalCategory;
  } = {};

  if (params.country_name !== undefined && params.country_name !== '') {
    if (!CANONICAL_COUNTRY_SET.has(params.country_name)) {
      throw new MlPipelineError(
        'validation_error',
        `Invalid country_name filter "${params.country_name}". Must match a valid dataset country.`,
        endpoint
      );
    }
    validated.country_name = params.country_name;
  }

  if (params.category !== undefined && params.category !== '') {
    if (!CANONICAL_CATEGORY_SET.has(params.category)) {
      throw new MlPipelineError(
        'validation_error',
        `Invalid category filter "${params.category}". Must match a valid dataset category.`,
        endpoint
      );
    }
    validated.category = params.category;
  }

  return validated;
}

/**
 * Step 3: Strict Payload Construction.
 * Guarantees ONLY `country_name` and `category` are serialized—never sends extra fields
 * and never alters canonical categorical encoding.
 */
export function constructPredictionPayload(validated: {
  country_name: CanonicalCountry;
  category: CanonicalCategory;
}): { country_name: CanonicalCountry; category: CanonicalCategory } {
  return Object.freeze({
    country_name: validated.country_name,
    category: validated.category,
  });
}

/**
 * Step 7: Runtime JSON Response Schema Validators (detects `invalid_response`).
 */
function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function validateDivergenceResponse(
  raw: unknown,
  endpoint: string
): DivergenceResponse {
  if (!isRecord(raw)) {
    throw new MlPipelineError(
      'invalid_response',
      'Malformed JSON response: expected an object from Divergence endpoint.',
      endpoint
    );
  }

  if (
    typeof raw.country_name !== 'string' ||
    typeof raw.category !== 'string' ||
    typeof raw.record_date !== 'string' ||
    typeof raw.predicted_divergence_score !== 'number' ||
    !Number.isFinite(raw.predicted_divergence_score) ||
    typeof raw.status !== 'string'
  ) {
    throw new MlPipelineError(
      'invalid_response',
      'Response schema mismatch on /predict/divergence: missing or non-numeric predicted_divergence_score.',
      endpoint
    );
  }

  return {
    country_name: raw.country_name,
    category: raw.category,
    record_date: raw.record_date,
    predicted_divergence_score: raw.predicted_divergence_score,
    status: raw.status,
  };
}

function validateForecastResponse(
  raw: unknown,
  endpoint: string
): ForecastResponse {
  if (!isRecord(raw)) {
    throw new MlPipelineError(
      'invalid_response',
      'Malformed JSON response: expected an object from Forecast endpoint.',
      endpoint
    );
  }

  if (
    typeof raw.country_name !== 'string' ||
    typeof raw.category !== 'string' ||
    typeof raw.target_variable !== 'string' ||
    !Array.isArray(raw.forecast_points) ||
    raw.forecast_points.length === 0
  ) {
    throw new MlPipelineError(
      'invalid_response',
      'Response schema mismatch on /forecast/search-interest: forecast_points array is missing or empty.',
      endpoint
    );
  }

  const points: WeeklyForecastPoint[] = raw.forecast_points.map(
    (pt: unknown, idx: number) => {
      if (
        !isRecord(pt) ||
        typeof pt.week_date !== 'string' ||
        typeof pt.predicted_search_interest !== 'number' ||
        !Number.isFinite(pt.predicted_search_interest)
      ) {
        throw new MlPipelineError(
          'invalid_response',
          `Invalid forecast point at index ${idx}: expected week_date (string) and predicted_search_interest (number).`,
          endpoint
        );
      }
      return {
        week_date: pt.week_date,
        predicted_search_interest: pt.predicted_search_interest,
      };
    }
  );

  return {
    country_name: raw.country_name,
    category: raw.category,
    target_variable: raw.target_variable,
    forecast_points: points,
    status: typeof raw.status === 'string' ? raw.status : 'success',
  };
}

function validateTableDataResponse(
  raw: unknown,
  endpoint: string
): TableDataResponse {
  if (
    !isRecord(raw) ||
    typeof raw.total_records !== 'number' ||
    !Array.isArray(raw.columns) ||
    !Array.isArray(raw.data)
  ) {
    throw new MlPipelineError(
      'invalid_response',
      'Response schema mismatch on segmentation endpoint: expected total_records, columns, and data array.',
      endpoint
    );
  }

  const validatedRows: SegmentationRecord[] = raw.data.map(
    (item: unknown, idx: number) => {
      if (
        !isRecord(item) ||
        typeof item.country_name !== 'string' ||
        typeof item.category !== 'string' ||
        typeof item.mean_search_interest !== 'number' ||
        typeof item.mean_media_volume !== 'number' ||
        typeof item.mean_demand_to_hype_ratio !== 'number' ||
        typeof item.search_interest_trend_slope !== 'number' ||
        typeof item.mean_net_sentiment !== 'number' ||
        typeof item.mean_gdp_per_capita !== 'number'
      ) {
        throw new MlPipelineError(
          'invalid_response',
          `Invalid segmentation record at row ${idx}: missing required numerical fingerprint fields.`,
          endpoint
        );
      }

      return {
        country_name: item.country_name,
        category: item.category,
        mean_search_interest: item.mean_search_interest,
        mean_media_volume: item.mean_media_volume,
        mean_demand_to_hype_ratio: item.mean_demand_to_hype_ratio,
        search_interest_trend_slope: item.search_interest_trend_slope,
        mean_net_sentiment: item.mean_net_sentiment,
        mean_gdp_per_capita: item.mean_gdp_per_capita,
        Cluster_Label:
          typeof item.Cluster_Label === 'number'
            ? item.Cluster_Label
            : undefined,
        Cluster_Name:
          typeof item.Cluster_Name === 'string' ? item.Cluster_Name : undefined,
      };
    }
  );

  return {
    total_records: raw.total_records,
    columns: raw.columns.map(String),
    data: validatedRows,
  };
}

function validateMarkdownReportResponse(
  raw: unknown,
  endpoint: string
): MarkdownReportResponse {
  if (
    !isRecord(raw) ||
    typeof raw.report_title !== 'string' ||
    typeof raw.content !== 'string' ||
    raw.content.trim().length === 0
  ) {
    throw new MlPipelineError(
      'invalid_response',
      'Response schema mismatch on report endpoint: expected non-empty report_title and Markdown content.',
      endpoint
    );
  }

  return {
    report_title: raw.report_title,
    content: raw.content,
  };
}

function validateHealthResponse(
  raw: unknown,
  endpoint: string
): HealthResponse {
  if (
    !isRecord(raw) ||
    typeof raw.status !== 'string' ||
    !Array.isArray(raw.loaded_artifacts) ||
    !Array.isArray(raw.loaded_dataframes) ||
    !Array.isArray(raw.loaded_reports)
  ) {
    throw new MlPipelineError(
      'invalid_response',
      'Invalid health check response schema from backend.',
      endpoint
    );
  }

  return {
    status: raw.status,
    loaded_artifacts: raw.loaded_artifacts.map(String),
    loaded_dataframes: raw.loaded_dataframes.map(String),
    loaded_reports: raw.loaded_reports.map(String),
  };
}

async function requestMlApi<T>(
  endpointPath: string,
  options: RequestInit = {},
  validator: (raw: unknown, endpoint: string) => T,
  metaHooks?: {
    constructedPayload?: Record<string, string> | null;
    queryString?: string;
    onMeta?: (meta: PipelineExecutionMeta) => void;
  }
): Promise<T> {
  const proxyUrl = `/api/ml${endpointPath}`;
  const startTime = performance.now();

  let response: Response;
  try {
    response = await fetch(proxyUrl, {
      ...options,
      headers: {
        Accept: 'application/json',
        'x-upstream-api-base': API_BASE_URL,
        ...(options.headers || {}),
      },
    });
  } catch (networkErr: unknown) {
    const msg =
      networkErr instanceof Error
        ? networkErr.message
        : 'Network request failed while contacting the ML backend.';
    throw new MlPipelineError(
      'network_error',
      `Network error while connecting to ${API_BASE_URL}${endpointPath}: ${msg}`,
      endpointPath
    );
  }

  const durationMs = Math.round(performance.now() - startTime);

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} (${response.statusText})`;
    try {
      const errJson = await response.json();
      if (typeof errJson?.detail === 'string') {
        errorDetail = errJson.detail;
      } else if (Array.isArray(errJson?.detail)) {
        errorDetail = errJson.detail
          .map((d: { msg?: string; loc?: unknown[] }) => {
            const field = Array.isArray(d.loc) ? d.loc.join('.') : '';
            return field ? `${field}: ${d.msg}` : d.msg || JSON.stringify(d);
          })
          .join('; ');
      }
    } catch {
      // Fallback if error body is not JSON
    }

    // Classify HTTP error into validation_error, network_error, or backend_error
    if (response.status === 422) {
      throw new MlPipelineError(
        'validation_error',
        `Schema validation rejected by FastAPI (HTTP 422): ${errorDetail}`,
        endpointPath,
        422
      );
    }

    if (
      response.status === 502 ||
      response.status === 503 ||
      response.status === 504
    ) {
      throw new MlPipelineError(
        'network_error',
        `Gateway / Render cold-start timeout (HTTP ${response.status}): ${errorDetail}`,
        endpointPath,
        response.status
      );
    }

    throw new MlPipelineError(
      'backend_error',
      errorDetail,
      endpointPath,
      response.status
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = await response.json();
  } catch {
    throw new MlPipelineError(
      'invalid_response',
      `Expected valid JSON from ${endpointPath}, but received unparseable response payload.`,
      endpointPath,
      response.status
    );
  }

  const validatedResult = validator(parsedJson, endpointPath);

  if (metaHooks?.onMeta) {
    metaHooks.onMeta({
      endpoint: endpointPath,
      method: (options.method as 'GET' | 'POST') || 'GET',
      constructedPayload: metaHooks.constructedPayload ?? null,
      queryString: metaHooks.queryString,
      durationMs,
      coldStartDetected: durationMs >= COLD_START_THRESHOLD_MS,
      timestampIso: new Date().toISOString(),
      responseStatus: response.status,
    });
  }

  return validatedResult;
}

export const nexusDemandApi = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  async checkHealth(): Promise<HealthResponse> {
    return requestMlApi<HealthResponse>(
      API_ENDPOINTS.HEALTH,
      { method: 'GET' },
      validateHealthResponse
    );
  },

  /**
   * Conceptual Flow:
   * User Input → Client Validation → Payload Construction → API Request → Backend → ML Prediction → JSON Response → Frontend Result
   */
  async predictDivergence(
    rawInput: DivergenceRequest,
    onMeta?: (meta: PipelineExecutionMeta) => void
  ): Promise<DivergenceResponse> {
    const validated = validateRequiredMarketInput(
      rawInput,
      API_ENDPOINTS.PREDICT_DIVERGENCE
    );
    const strictPayload = constructPredictionPayload(validated);

    return requestMlApi<DivergenceResponse>(
      API_ENDPOINTS.PREDICT_DIVERGENCE,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strictPayload),
      },
      validateDivergenceResponse,
      {
        constructedPayload: strictPayload,
        onMeta,
      }
    );
  },

  /**
   * Conceptual Flow:
   * User Input → Client Validation → Payload Construction → API Request → Backend → ML Prediction → JSON Response → Frontend Result
   */
  async forecastSearchInterest(
    rawInput: ForecastRequest,
    onMeta?: (meta: PipelineExecutionMeta) => void
  ): Promise<ForecastResponse> {
    const validated = validateRequiredMarketInput(
      rawInput,
      API_ENDPOINTS.FORECAST_SEARCH_INTEREST
    );
    const strictPayload = constructPredictionPayload(validated);

    return requestMlApi<ForecastResponse>(
      API_ENDPOINTS.FORECAST_SEARCH_INTEREST,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strictPayload),
      },
      validateForecastResponse,
      {
        constructedPayload: strictPayload,
        onMeta,
      }
    );
  },

  async getMarketSegmentation(
    params?: {
      country_name?: CanonicalCountry | '';
      category?: CanonicalCategory | '';
    },
    onMeta?: (meta: PipelineExecutionMeta) => void
  ): Promise<TableDataResponse> {
    const validated = validateOptionalSegmentationFilter(
      params,
      API_ENDPOINTS.CLUSTERS_MARKET_SEGMENTATION
    );
    const searchParams = new URLSearchParams();
    if (validated.country_name) {
      searchParams.set('country_name', validated.country_name);
    }
    if (validated.category) {
      searchParams.set('category', validated.category);
    }
    const qs = searchParams.toString();
    const path = `${API_ENDPOINTS.CLUSTERS_MARKET_SEGMENTATION}${
      qs ? `?${qs}` : ''
    }`;

    return requestMlApi<TableDataResponse>(
      path,
      { method: 'GET' },
      validateTableDataResponse,
      {
        constructedPayload:
          Object.keys(validated).length > 0
            ? (validated as Record<string, string>)
            : null,
        queryString: qs || undefined,
        onMeta,
      }
    );
  },

  async get4WeeksSegmentation(
    params?: {
      country_name?: CanonicalCountry | '';
      category?: CanonicalCategory | '';
    },
    onMeta?: (meta: PipelineExecutionMeta) => void
  ): Promise<TableDataResponse> {
    const validated = validateOptionalSegmentationFilter(
      params,
      API_ENDPOINTS.CLUSTERS_4W_SEGMENTATION
    );
    const searchParams = new URLSearchParams();
    if (validated.country_name) {
      searchParams.set('country_name', validated.country_name);
    }
    if (validated.category) {
      searchParams.set('category', validated.category);
    }
    const qs = searchParams.toString();
    const path = `${API_ENDPOINTS.CLUSTERS_4W_SEGMENTATION}${
      qs ? `?${qs}` : ''
    }`;

    return requestMlApi<TableDataResponse>(
      path,
      { method: 'GET' },
      validateTableDataResponse,
      {
        constructedPayload:
          Object.keys(validated).length > 0
            ? (validated as Record<string, string>)
            : null,
        queryString: qs || undefined,
        onMeta,
      }
    );
  },

  async getMarketSegmentationReport(): Promise<MarkdownReportResponse> {
    return requestMlApi<MarkdownReportResponse>(
      API_ENDPOINTS.REPORTS_MARKET_SEGMENTATION,
      { method: 'GET' },
      validateMarkdownReportResponse
    );
  },

  async get4WeeksSegmentationReport(): Promise<MarkdownReportResponse> {
    return requestMlApi<MarkdownReportResponse>(
      API_ENDPOINTS.REPORTS_4W_SEGMENTATION,
      { method: 'GET' },
      validateMarkdownReportResponse
    );
  },
};
