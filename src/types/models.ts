export type CanonicalCountry =
  | 'Australia'
  | 'Brazil'
  | 'Canada'
  | 'China'
  | 'France'
  | 'India'
  | 'Kenya'
  | 'Mexico'
  | 'Nigeria'
  | 'Singapore'
  | 'South_Africa'
  | 'United_Arab_Emirates'
  | 'United_Kingdom'
  | 'United_States';

export type CanonicalCategory =
  | 'Fashion_Beauty'
  | 'Fitness_Wearables'
  | 'Nutrition_Diets';

export interface RootResponse {
  message: string;
  status: string;
  documentation: string;
  health_check: string;
}

export interface HealthResponse {
  status: string;
  loaded_artifacts: string[];
  loaded_dataframes: string[];
  loaded_reports: string[];
}

export interface DivergenceRequest {
  country_name: CanonicalCountry;
  category: CanonicalCategory;
}

export interface DivergenceResponse {
  country_name: string;
  category: string;
  record_date: string;
  predicted_divergence_score: number;
  status: string;
}

export interface ForecastRequest {
  country_name: CanonicalCountry;
  category: CanonicalCategory;
}

export interface WeeklyForecastPoint {
  week_date: string;
  predicted_search_interest: number;
}

export interface ForecastResponse {
  country_name: string;
  category: string;
  target_variable: string;
  forecast_points: WeeklyForecastPoint[];
  status: string;
}

export interface SegmentationRecord {
  country_name: string;
  category: string;
  mean_search_interest: number;
  mean_media_volume: number;
  mean_demand_to_hype_ratio: number;
  search_interest_trend_slope: number;
  mean_net_sentiment: number;
  mean_gdp_per_capita: number;
  Cluster_Label?: number;
  Cluster_Name?: string;
}

export interface TableDataResponse {
  total_records: number;
  columns: string[];
  data: SegmentationRecord[];
}

export interface MarkdownReportResponse {
  report_title: string;
  content: string;
}

export type ModelTypeKey =
  | 'divergence'
  | 'forecast'
  | 'segmentation_overall'
  | 'segmentation_4w';

export interface UserProfile {
  uid: string;
  displayName: string;
  organization: string;
  jobTitle: string;
  preferredCountry: CanonicalCountry;
  preferredCategory: CanonicalCategory;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type PredictionStatus = 'success' | 'error';

export interface PredictionRecord {
  id: string;
  uid: string;
  modelType: ModelTypeKey;
  modelDisplayName: string;
  countryName: string;
  category: string;
  summaryValue: string;
  numericResult: number;
  recordDate: string;
  predictionStatus: PredictionStatus;
  notes: string;
  createdAtIso: string;
}

export type InquiryTopic =
  | 'API Integration'
  | 'Custom Market Coverage'
  | 'Model Calibration'
  | 'Enterprise Licensing';

export interface ContactInquiry {
  id: string;
  uid: string;
  senderName: string;
  organization: string;
  topic: InquiryTopic;
  message: string;
  status: 'submitted' | 'resolved';
  createdAtIso: string;
}

export type LoginMethod = 'google' | 'password' | 'admin_quick';
export type LoginStatus = 'success' | 'failed';

export interface UserLoginLog {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  loginMethod: LoginMethod;
  status: LoginStatus;
  userAgent: string;
  platform: string;
  locationTimezone: string;
  screenResolution: string;
  createdAtIso: string;
}

export type AdminRole = 'super_admin' | 'admin' | 'analyst';

export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  role: AdminRole;
  assignedBy: string;
  isActive: boolean;
  createdAtIso: string;
  updatedAtIso: string;
}

export type AppPage =
  | 'home'
  | 'dashboard'
  | 'divergence'
  | 'forecast'
  | 'segmentation'
  | 'history'
  | 'about'
  | 'contact'
  | 'signin'
  | 'signup'
  | 'profile'
  | 'admin';

export type MlErrorCategory =
  | 'validation_error'
  | 'network_error'
  | 'backend_error'
  | 'invalid_response';

export interface PipelineExecutionMeta {
  endpoint: string;
  method: 'GET' | 'POST';
  constructedPayload: Record<string, string> | null;
  queryString?: string;
  durationMs: number;
  coldStartDetected: boolean;
  timestampIso: string;
  responseStatus: number;
}

