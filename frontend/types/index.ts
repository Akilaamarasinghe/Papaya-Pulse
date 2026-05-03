// User & Auth Types
export type UserRole = 'farmer' | 'customer';
export type District = 'Hambantota' | 'Matara' | 'Galle';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  district: District;
  profilePhoto?: string | null;
  createdAt?: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  district: District;
}

export interface LoginData {
  email: string;
  password: string;
}

// Growth Stage Types
export interface GrowthStageResponse {
  stage: string;
  advice: string[];
}

// Image Processing ML response types
export interface GrowthStagePapayaValidation {
  predicted_class: string;
  confidence: number;
  threshold_required: number;
  passed_threshold: boolean;
  probabilities: { [key: string]: number };
}

export interface GrowthStageCurrentStage {
  code: string;
  name: string;
  name_si?: string;
  height: string;
  height_si?: string;
  duration: string;
  duration_si?: string;
  characteristics: string;
  characteristics_si?: string;
}

export interface GrowthStageCareInstructions {
  watering: string;
  watering_si?: string;
  fertilizer: string;
  fertilizer_si?: string;
  soil: string;
  soil_si?: string;
  spacing: string;
  spacing_si?: string;
  protection: string;
  protection_si?: string;
}

export interface GrowthStageTransitionGuide {
  next_stage: string;
  next_stage_si?: string;
  signs_to_watch: string;
  signs_to_watch_si?: string;
  transition_focus: string;
  transition_focus_si?: string;
}

export interface GrowthStageGuidance {
  current_stage: GrowthStageCurrentStage;
  care_instructions: GrowthStageCareInstructions;
  transition_guide: GrowthStageTransitionGuide;
  expert_guidance: string;
}

export interface GrowthStageGradeDetails {
  grade: string;
  confidence: number;
  probabilities: { [key: string]: number };
}

export interface GrowthStageMLResponse {
  is_papaya: boolean;
  papaya_validation: GrowthStagePapayaValidation;
  grade_prediction: GrowthStageGradeDetails | null;
  growth_guidance: GrowthStageGuidance | null;
}

export interface HarvestPredictionRequest {
  district: District;
  soil_type: 'laterite soils' | 'sandy loam';
  watering_method: 'Drip' | 'Sprinkler' | 'Manual';
  watering_frequency_per_week: number;
  trees_count: number;
  planted_month: number;
}

export interface HarvestPredictionResponse {
  farmer_explanation: string[];
  farmer_explanation_si?: string[];
  predictions: {
    harvest_days_remaining: number;
    harvest_days_total: number;
    yield_per_tree: number;
  };
}

// Quality Grader Types
export type PapayaVariety = 'RedLady' | 'Tenim' | 'Solo';
export type MaturityLevel = 'unmature' | 'half-mature' | 'mature';
export type QualityGrade = '1' | '2' | '3'; // Updated to match new ML model output
export type MarketGrade = 'A' | 'B' | 'C'; // Market grading system
export type QualityCategory = 'Best Quality' | 'factory outlet';

export interface FeatureContribution {
  feature: string;
  value: number;
  contribution: number;
  abs_contribution: number;
}

export interface FarmerQualityRequest {
  farmer_id: string;
  district: District;
  variety: PapayaVariety;
  maturity: MaturityLevel;
  quality_category: QualityCategory;
  days_since_picked: number;
}

export interface FarmerQualityResponse {
  // For Best Quality (ML service response)
  predicted_grade?: string; // The predicted grade from ML model
  confidence?: number; // Confidence score (0-1) or string like "85.5%"
  all_probabilities?: { [grade: string]: number }; // Probabilities for all grades
  extracted_color?: string; // Hex color extracted from image
  explanation?: string; // Detailed explanation text
  feature_contributions?: FeatureContribution[]; // All feature contributions
  top_features?: FeatureContribution[]; // Top 3 features
  
  // For Factory Outlet (IM service response)
  prediction?: string; // Type A or Type B
  
  // Common fields
  quality_category: QualityCategory; // Category user selected
}

export interface CustomerQualityRequest {
  city?: string;
}

export interface CustomerQualityResponse {
  color: string;
  variety: string;
  ripen_days: number;
  grade: QualityGrade;
  average_temperature: number;
  city?: string;
  ripeness_stage?: string;
  taste?: string;
  buying_recommendation?: string;
  weather_last_7_days?: {
    avg_temp?: number;
    max_temp?: number;
    min_temp?: number;
  };
  color_ratios?: {
    green?: number;
    yellow?: number;
    orange?: number;
  };
  final_suggestion?: string;
  papaya_probability?: string;
}

// Market Price Types
export type CultivationMethod = 'Organic' | 'Inorganic';

export interface MarketPriceRequest {
  district: District;
  variety: PapayaVariety;
  cultivation_method: CultivationMethod;
  quality_grade: MarketGrade; // Use MarketGrade for market pricing
  total_harvest_count: number;
  avg_weight_per_fruit: number;
  expected_selling_date: string;
}

export interface MarketPriceResponse {
  predicted_price_per_kg: number;
  predicted_total_income: number;
  suggested_selling_day: string;
  explanation: string[];
}

// ── Customer Market Prediction Types (5004 service) ───────────────────────────
export interface CustomerMarketPriceDriver {
  feature: string;
  impact: number;
}

export interface CustomerMarketPriceRow {
  variety: string;
  price_lkr_per_kg: number;
  price_drivers: CustomerMarketPriceDriver[];
}

export interface CustomerMarketAnalysis {
  location: string;
  month: number;
  rainfall_mm: number;
  ripeness: string;
  confidence_percent: number;
  color_ratios: {
    green: number;
    yellow: number;
    orange: number;
  };
  ripeness_drivers: CustomerMarketPriceDriver[];
  price_table: CustomerMarketPriceRow[];
  seller_price: number | null;
}

export interface CustomerMarketResponse {
  analysis: CustomerMarketAnalysis;
  final_market_advice: string;
}
// ─────────────────────────────────────────────────────────────────────────────

// Leaf Disease Types
export type DiseaseType = 'Anthracnose' | 'Curl' | 'Mite disease' | 'Mosaic virus' | 'Healthy' | 'NotPapaya';
export type SeverityLevel = 'mild' | 'moderate' | 'severe' | 'unknown';

export interface LeafDiseaseResponse {
  disease: DiseaseType;
  disease_confidence: number;
  severity: SeverityLevel;
  severity_confidence: number;
  is_leaf?: boolean;
  leaf_confidence?: number;
  not_leaf_confidence?: number;
  stage_label?: string | null;
  stage_confidence?: number;
  model_metadata?: {
    model_version: string | null;
    inference_time_ms: number | null;
    served_by?: string | null;
  } | null;
  raw_payload?: Record<string, unknown> | null;
}

export interface LeafPredictionHistory extends LeafDiseaseResponse {
  id: string;
  timestamp: string;
  imageUri?: string;
}

// Leaf Disease Recommendation Types
export type GrowthStage = 'vegetative' | 'flowering' | 'fruiting';

export interface LeafFertilizerRecommendation {
  action: string;
  confidence?: number;
  advice_en?: string;
  advice_si?: string;
  treatment?: string;
  nitrogen_adjustment?: string;
  phosphorus_adjustment?: string;
  potassium_adjustment?: string;
  notes?: string;
}

export interface DayRisk {
  date: string;
  tmean: number;
  rain_mm: number;
  humidity_est: number;
  day_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface WeatherSummary {
  tmean_7d_avg_c: number;
  total_rain_7d_mm: number;
  tmax_c: number;
  tmin_c: number;
  humidity_est_pct: number;
}

export interface LeafWeatherRisk {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_level_si?: string;
  risk_score?: number;
  alert_color?: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  action?: string;
  action_si?: string;
  urgency_en?: string;
  urgency_si?: string;
  frequency?: string;
  frequency_si?: string;
  weather_summary?: WeatherSummary;
  daily_risk?: DayRisk[];
  disease_explanation?: string;
  disease_explanation_si?: string;
  future_outlook_en?: string;
  future_outlook_si?: string;
  why_this_risk_en?: string;
  why_this_risk_si?: string;
  model_used?: string;
}

export interface LeafAIAdvice {
  ai_enriched: boolean;
  advice_en: string;
  advice_si: string;
  outlook_en?: string;
  outlook_si?: string;
  urgent_action_en?: string;
  urgent_action_si?: string;
  confidence?: number;
}

// ---------------------------------------------------------------------------
// Prevention step — maps to PREV_META + AI per-step guide from backend
// ---------------------------------------------------------------------------
export interface PreventionStep {
  step: number;
  code: string;
  name_en: string | null;
  description_en: string;
  description_si: string;
  // classification
  type: 'chemical_inorganic' | 'chemical_organic' | 'biological' | 'cultural';
  type_label_en: string;
  type_label_si: string;
  category: string;
  category_label_en: string;
  category_label_si: string;
  organic: boolean;
  // dosage / scheduling
  dosage: string | null;
  frequency: string | null;
  phi_days: number | null;
  timing: string | null;
  // static how-to
  how_to_mix: string | null;
  how_to_apply: string | null;
  safety: string | null;
  // AI-generated guides (may be null if AI unavailable)
  ai_how_to_en: string | null;
  ai_how_to_si: string | null;
  ai_warning_en: string | null;
  ai_warning_si: string | null;
  doa_approved: boolean;
}

export interface LeafRecommendResponse {
  disease: string;
  severity: string;
  growth_stage: string;
  soil_type?: string;
  district?: string;
  fertilizer: LeafFertilizerRecommendation;
  prevention?: {
    pack: string[];
    steps_en: string[];
    steps_si: string[];
    steps_detail: PreventionStep[];
    
  };
  weather_risk?: LeafWeatherRisk;
  ai_advice?: LeafAIAdvice;
}
