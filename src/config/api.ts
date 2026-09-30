import { CanonicalCategory, CanonicalCountry } from '../types/models';

/**
 * Configurable Production FastAPI Base URL read from Vite environment variables.
 * Never scatter hardcoded URLs across UI components.
 */
const rawEnvBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
export const API_BASE_URL: string = (
  !rawEnvBaseUrl || rawEnvBaseUrl.includes('nexusdemand.onrender.com')
    ? 'https://demandaura.onrender.com'
    : rawEnvBaseUrl
).replace(/\/+$/, '');

export const API_ENDPOINTS = {
  ROOT: '/',
  HEALTH: '/health',
  DOCS: `${API_BASE_URL}/docs`,
  OPENAPI_JSON: `${API_BASE_URL}/openapi.json`,
  PREDICT_DIVERGENCE: '/predict/divergence',
  FORECAST_SEARCH_INTEREST: '/forecast/search-interest',
  CLUSTERS_MARKET_SEGMENTATION: '/clusters/market-segmentation',
  CLUSTERS_4W_SEGMENTATION: '/clusters/4-weeks-segmentation',
  REPORTS_MARKET_SEGMENTATION: '/reports/market-segmentation',
  REPORTS_4W_SEGMENTATION: '/reports/4-weeks-segmentation',
} as const;

export const VALID_COUNTRIES: {
  value: CanonicalCountry;
  label: string;
  iso2: string;
  region: string;
}[] = [
  { value: 'Australia', label: 'Australia', iso2: 'AU', region: 'Asia-Pacific' },
  { value: 'Brazil', label: 'Brazil', iso2: 'BR', region: 'Latin America' },
  { value: 'Canada', label: 'Canada', iso2: 'CA', region: 'North America' },
  { value: 'China', label: 'China', iso2: 'CN', region: 'Asia-Pacific' },
  { value: 'France', label: 'France', iso2: 'FR', region: 'Europe' },
  { value: 'India', label: 'India', iso2: 'IN', region: 'Asia-Pacific' },
  { value: 'Kenya', label: 'Kenya', iso2: 'KE', region: 'Middle East & Africa' },
  { value: 'Mexico', label: 'Mexico', iso2: 'MX', region: 'Latin America' },
  { value: 'Nigeria', label: 'Nigeria', iso2: 'NG', region: 'Middle East & Africa' },
  { value: 'Singapore', label: 'Singapore', iso2: 'SG', region: 'Asia-Pacific' },
  { value: 'South_Africa', label: 'South Africa', iso2: 'ZA', region: 'Middle East & Africa' },
  {
    value: 'United_Arab_Emirates',
    label: 'United Arab Emirates',
    iso2: 'AE',
    region: 'Middle East & Africa',
  },
  { value: 'United_Kingdom', label: 'United Kingdom', iso2: 'GB', region: 'Europe' },
  {
    value: 'United_States',
    label: 'United States',
    iso2: 'US',
    region: 'North America',
  },
];

export interface CategoryKeywordBatch {
  theme: string;
  keywords: string[];
}

export const DEVELOPER_INFO = {
  name: 'CH Srivatsava',
  role: 'Platform Developer & Creator',
  github: 'https://github.com/sri21-3/',
  githubDisplay: 'github.com/sri21-3',
  linkedin: 'https://www.linkedin.com/in/21srivatsava',
  linkedinDisplay: 'linkedin.com/in/21srivatsava',
  email: 'srisrivatsava120@gmail.com',
} as const;

export const VALID_CATEGORIES: {
  value: CanonicalCategory;
  label: string;
  description: string;
  keywordsSample: string[];
  keywordBatches: CategoryKeywordBatch[];
}[] = [
  {
    value: 'Fashion_Beauty',
    label: 'Fashion & Beauty',
    description:
      'Apparel, luxury & streetwear, skincare, cosmetics, haircare, fragrance, and footwear',
    keywordsSample: [
      'fashion',
      'luxury fashion',
      'streetwear',
      'skincare',
      'cosmetics',
      'fragrance',
      'sneakers',
    ],
    keywordBatches: [
      {
        theme: 'Core Apparel & Designer Style',
        keywords: ['fashion', 'clothing', 'apparel', 'style', 'designer'],
      },
      {
        theme: 'Luxury, Fast Fashion & Streetwear',
        keywords: [
          'luxury fashion',
          'fast fashion',
          'streetwear',
          'athleisure',
        ],
      },
      {
        theme: 'Skincare & Daily Cosmetics',
        keywords: ['skincare', 'makeup', 'cosmetics', 'moisturizer'],
      },
      {
        theme: 'Anti-Aging, Haircare & Fragrance',
        keywords: ['anti aging', 'haircare', 'shampoo', 'fragrance'],
      },
      {
        theme: 'Perfume, Treatments & Footwear',
        keywords: ['perfume', 'beauty treatment', 'sneakers', 'jewelry'],
      },
    ],
  },
  {
    value: 'Fitness_Wearables',
    label: 'Fitness & Wearables',
    description:
      'Gym workouts, studio classes, endurance sports, smartwatches, and biometric trackers',
    keywordsSample: [
      'fitness',
      'yoga',
      'pilates',
      'running',
      'smartwatch',
      'fitness tracker',
      'garmin',
    ],
    keywordBatches: [
      {
        theme: 'Gym & Core Strength Training',
        keywords: ['fitness', 'exercise', 'workout', 'training', 'gym'],
      },
      {
        theme: 'Studio & Mind-Body Workouts',
        keywords: ['yoga', 'pilates', 'aerobics', 'hiit'],
      },
      {
        theme: 'Endurance & High-Intensity Sports',
        keywords: ['crossfit', 'cardio', 'running', 'cycling'],
      },
      {
        theme: 'Smartwatches & Fitness Trackers',
        keywords: ['wearable', 'smartwatch', 'fitness tracker', 'garmin'],
      },
      {
        theme: 'Connected Ecosystem & Biometrics',
        keywords: [
          'fitbit',
          'apple watch',
          'heart rate monitor',
          'step counter',
        ],
      },
    ],
  },
  {
    value: 'Nutrition_Diets',
    label: 'Nutrition & Diets',
    description:
      'Plant-based eating, keto & fasting, superfoods, protein supplements, and probiotics',
    keywordsSample: [
      'nutrition',
      'plant based',
      'keto',
      'intermittent fasting',
      'protein powder',
      'probiotics',
    ],
    keywordBatches: [
      {
        theme: 'Core & Plant-Based Nutrition',
        keywords: ['diet', 'nutrition', 'vegan', 'vegetarian', 'plant based'],
      },
      {
        theme: 'Low-Carb & Fasting Protocols',
        keywords: ['keto', 'paleo', 'low carb', 'intermittent fasting'],
      },
      {
        theme: 'Superfoods, Detox & Weight Wellness',
        keywords: ['detox', 'superfood', 'organic', 'weight loss'],
      },
      {
        theme: 'Performance Protein & Supplements',
        keywords: ['supplement', 'protein powder', 'whey', 'creatine'],
      },
      {
        theme: 'Vitamins, Gut Health & Functional Food',
        keywords: ['vitamin', 'minerals', 'probiotics', 'functional food'],
      },
    ],
  },
];

const COUNTRY_LABEL_MAP: Record<string, string> = Object.fromEntries(
  VALID_COUNTRIES.map((c) => [c.value.toLowerCase(), c.label])
);

const CATEGORY_LABEL_MAP: Record<string, string> = Object.fromEntries(
  VALID_CATEGORIES.map((c) => [c.value.toLowerCase(), c.label])
);

/**
 * Converts internal canonical identifiers (e.g. 'United_Arab_Emirates', 'Fashion_Beauty')
 * into clean human-readable UI labels ('United Arab Emirates', 'Fashion & Beauty').
 */
export function formatEntityLabel(raw: string): string {
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (COUNTRY_LABEL_MAP[lower]) return COUNTRY_LABEL_MAP[lower];
  if (CATEGORY_LABEL_MAP[lower]) return CATEGORY_LABEL_MAP[lower];
  if (raw === 'All_14_Countries') return 'All 14 Countries';
  if (raw === 'All_3_Categories') return 'All 3 Categories';
  if (raw === 'latest_available') return 'Latest Available Week';
  return raw.replace(/_/g, ' ');
}

/**
 * Explicit end-to-end mapping table:
 * UI Label → Frontend State → API Field → Data Type → Backend Schema → Model Feature
 */
export interface FieldMappingContract {
  uiLabel: string;
  uiControl: string;
  frontendState: string;
  apiField: string;
  dataType: string;
  backendSchema: string;
  modelFeature: string;
}

export const USER_INPUT_FIELD_MAPPINGS: FieldMappingContract[] = [
  {
    uiLabel: 'Target Country',
    uiControl: 'Dropdown Select (14 Countries)',
    frontendState: 'selectedCountry',
    apiField: 'country_name',
    dataType: 'string (CanonicalCountry)',
    backendSchema: 'DivergenceRequest / ForecastRequest / Query Param',
    modelFeature:
      'OneHotEncoder (country_name_*) in XGBoost | Categorical (country_name) in LightGBM | Index Filter in K-Means',
  },
  {
    uiLabel: 'Consumer Category',
    uiControl: 'Dropdown / Segmented Selector (3 Categories)',
    frontendState: 'selectedCategory',
    apiField: 'category',
    dataType: 'string (CanonicalCategory)',
    backendSchema: 'DivergenceRequest / ForecastRequest / Query Param',
    modelFeature:
      'OneHotEncoder (category_*) in XGBoost | Categorical (category) in LightGBM | Index Filter in K-Means',
  },
];

/**
 * Human-readable translations for internal ML features so cryptic snake_case names
 * are never shown raw as primary labels in the UI.
 */
export const FEATURE_DESCRIPTIONS: Record<
  string,
  { label: string; group: string; description: string }
> = {
  search_velocity: {
    label: 'Weekly Search Momentum',
    group: 'Consumer Demand',
    description: 'Week-over-week change in shopper search interest',
  },
  search_acceleration: {
    label: 'Search Growth Pace',
    group: 'Consumer Demand',
    description: 'Whether consumer search momentum is speeding up or slowing down',
  },
  search_velocity_lag1: {
    label: 'Prior Week Search Momentum',
    group: 'Recent Demand History',
    description: 'Shopper search momentum from 1 week ago',
  },
  search_velocity_lag2: {
    label: 'Two-Week Prior Search Momentum',
    group: 'Recent Demand History',
    description: 'Shopper search momentum from 2 weeks ago',
  },
  search_velocity_lag: {
    label: 'Recent Search Momentum',
    group: 'Recent Demand History',
    description: 'Recent week-over-week shift in consumer search activity',
  },
  search_acceleration_lag: {
    label: 'Recent Growth Acceleration',
    group: 'Recent Demand History',
    description: 'Recent shift in the pace of consumer search growth',
  },
  search_interest_lag_1: {
    label: 'Search Interest (1 Week Ago)',
    group: 'Historical Demand',
    description: 'Consumer search popularity index 1 week prior',
  },
  search_interest_lag_2: {
    label: 'Search Interest (2 Weeks Ago)',
    group: 'Historical Demand',
    description: 'Consumer search popularity index 2 weeks prior',
  },
  search_interest_lag_4: {
    label: 'Search Interest (4 Weeks Ago)',
    group: 'Historical Demand',
    description: 'Consumer search popularity index 4 weeks prior',
  },
  search_interest_roll_mean_4w: {
    label: '4-Week Average Search Interest',
    group: 'Recent Demand Baseline',
    description: 'Average consumer search interest over the past 4 weeks',
  },
  search_interest_roll_std_4w: {
    label: '4-Week Demand Stability',
    group: 'Recent Demand Baseline',
    description: 'How steady or volatile shopper interest has been over the past 4 weeks',
  },
  media_volume_roll_mean_4w: {
    label: '4-Week Average Media Coverage',
    group: 'Media Attention',
    description: 'Average weekly volume of news and editorial coverage over 4 weeks',
  },
  log_media_volume: {
    label: 'Weekly News & Media Coverage',
    group: 'Media Attention',
    description: 'Overall volume of news articles and media mentions during the week',
  },
  tone_net_sentiment: {
    label: 'Net Media Sentiment',
    group: 'Media Tone',
    description: 'Balance of positive versus negative tone in news and editorial coverage',
  },
  tone_polarity: {
    label: 'Media Sentiment Intensity',
    group: 'Media Tone',
    description: 'Strength of emotional language in category press coverage',
  },
  tone_activity_density: {
    label: 'Market Launch & Event Activity',
    group: 'Media Tone',
    description: 'Concentration of product launches, announcements, and commercial events in the news',
  },
  source_diversity: {
    label: 'Publisher Reach & Diversity',
    group: 'Media Attention',
    description: 'Breadth of distinct news outlets and publications covering the category',
  },
  demand_to_hype_ratio: {
    label: 'Demand-to-Media Ratio',
    group: 'Market Balance',
    description: 'Consumer search interest relative to the volume of media coverage',
  },
  inflation_rate: {
    label: 'Annual Consumer Inflation (%)',
    group: 'Economic Context',
    description: 'Local consumer price inflation affecting household discretionary spending',
  },
  internet_penetration: {
    label: 'Digital Reach (% Online Population)',
    group: 'Economic Context',
    description: 'Share of the national population with active internet access',
  },
  gdp_per_capita: {
    label: 'Average Purchasing Power (GDP per Capita)',
    group: 'Economic Context',
    description: 'National economic output per person in USD',
  },
  holiday_count: {
    label: 'National Shopping & Public Holidays',
    group: 'Seasonal Calendar',
    description: 'Number of national public holidays occurring during the week',
  },
  sin_week: {
    label: 'Seasonal Annual Cycle (Phase A)',
    group: 'Seasonal Calendar',
    description: 'Captures recurring time-of-year seasonal shopping patterns',
  },
  cos_week: {
    label: 'Seasonal Annual Cycle (Phase B)',
    group: 'Seasonal Calendar',
    description: 'Pairs with Phase A to track smooth week-by-week seasonal shifts across the year',
  },
  mean_search_interest: {
    label: 'Average Consumer Search Interest',
    group: 'Market Profile Indicator',
    description: 'Average shopper search popularity (0–100 scale)',
  },
  mean_media_volume: {
    label: 'Average Weekly Media Mentions',
    group: 'Market Profile Indicator',
    description: 'Average number of news and media articles per week',
  },
  mean_demand_to_hype_ratio: {
    label: 'Average Demand-to-Media Balance',
    group: 'Market Profile Indicator',
    description: 'Average ratio of shopper search interest to media coverage',
  },
  search_interest_trend_slope: {
    label: 'Demand Growth Direction',
    group: 'Market Profile Indicator',
    description: 'Rate at which consumer search interest is rising or cooling over time',
  },
  mean_net_sentiment: {
    label: 'Average Media Sentiment',
    group: 'Market Profile Indicator',
    description: 'Overall positive or negative tone of media coverage',
  },
  mean_gdp_per_capita: {
    label: 'Consumer Purchasing Power (USD)',
    group: 'Market Profile Indicator',
    description: 'Average GDP per capita reflecting local spending power',
  },
};

/**
 * Exact model specifications verified from training notebooks and main.py
 */
export const MODEL_SPECIFICATIONS = {
  divergence: {
    name: 'Demand vs. Hype Divergence Score',
    endpoint: API_ENDPOINTS.PREDICT_DIVERGENCE,
    method: 'POST',
    algorithm: 'Demand vs. Media Balance Analysis',
    hyperparameters:
      '14 Countries · 3 Consumer Verticals · -1.00 to +1.00 Scale',
    metrics: {
      trainRmse: 0.04,
      testRmse: 0.11,
      trainR2: 0.98,
      testR2: 0.84,
      targetRange: [-1.0, 1.0],
    },
    scaledNumericalFeatures: [
      'search_velocity',
      'search_acceleration',
      'tone_net_sentiment',
      'tone_polarity',
      'tone_activity_density',
      'source_diversity',
      'inflation_rate',
      'internet_penetration',
      'holiday_count',
      'search_velocity_lag1',
      'search_velocity_lag2',
    ],
    unscaledNumericalFeatures: ['log_media_volume'],
    encodedCategoricalCount: 17,
    totalOrderedFeatures: 29,
  },
  forecast: {
    name: '4-Week Consumer Search Interest Forecast',
    endpoint: API_ENDPOINTS.FORECAST_SEARCH_INTEREST,
    method: 'POST',
    algorithm: '4-Week Forward Demand Outlook',
    hyperparameters:
      '4-Week Horizon · Weekly 0–100 Search Popularity Index · 42 Markets',
    metrics: {
      trainRmse: 3.15,
      testRmse: 6.74,
      trainR2: 0.97,
      testR2: 0.88,
      horizonWeeks: 4,
    },
    orderedFeatures: [
      'country_name',
      'category',
      'demand_to_hype_ratio',
      'inflation_rate',
      'gdp_per_capita',
      'holiday_count',
      'search_interest_lag_1',
      'search_interest_lag_2',
      'search_interest_lag_4',
      'search_velocity_lag',
      'search_acceleration_lag',
      'search_interest_roll_mean_4w',
      'search_interest_roll_std_4w',
      'media_volume_roll_mean_4w',
      'sin_week',
      'cos_week',
    ],
  },
  segmentationOverall: {
    name: 'Long-Term Market Segmentation (3+ Years)',
    endpoint: API_ENDPOINTS.CLUSTERS_MARKET_SEGMENTATION,
    reportEndpoint: API_ENDPOINTS.REPORTS_MARKET_SEGMENTATION,
    method: 'GET',
    algorithm: '3+ Year Structural Market Grouping (4 Strategic Groups)',
    metrics: {
      silhouetteScore: 0.24,
      daviesBouldinIndex: 1.076,
      totalMarkets: 42,
      clustersCount: 4,
    },
    features: [
      'mean_search_interest',
      'mean_media_volume',
      'mean_demand_to_hype_ratio',
      'search_interest_trend_slope',
      'mean_net_sentiment',
      'mean_gdp_per_capita',
    ],
  },
  segmentation4W: {
    name: 'Recent 4-Week Market Momentum Segmentation',
    endpoint: API_ENDPOINTS.CLUSTERS_4W_SEGMENTATION,
    reportEndpoint: API_ENDPOINTS.REPORTS_4W_SEGMENTATION,
    method: 'GET',
    algorithm: '4-Week Rolling Momentum Grouping (7 Dynamic Profiles)',
    metrics: {
      silhouetteScore: 0.359,
      daviesBouldinIndex: 0.798,
      totalMarkets: 42,
      clustersCount: 7,
    },
    features: [
      'mean_search_interest',
      'mean_media_volume',
      'mean_demand_to_hype_ratio',
      'search_interest_trend_slope',
      'mean_net_sentiment',
      'mean_gdp_per_capita',
    ],
  },
} as const;
