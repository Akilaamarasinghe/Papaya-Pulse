// User & Auth Types
export type UserRole = 'farmer' | 'customer';
export type District = 'Hambanthota' | 'Matara' | 'Galle';

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
  predictions: {
    harvest_days_remaining: number;
    harvest_days_total: number;
    yield_per_tree: number;
  };
}

// Quality Grader Types
export type PapayaVariety = 'RedLady' | 'Tenim' | 'Solo';
export type MaturityLevel = 'unmature' | 'half-mature' | 'mature';
export type QualityGrade = 'I' | 'II' | 'III';
export type QualityCategory = 'Best Quality' | 'factory outlet';

export interface FarmerQualityRequest {
  farmer_id: string;
  district: District;
  variety: PapayaVariety;
  maturity: MaturityLevel;
  quality_category: QualityCategory;
  days_since_picked: number;
}

export interface FarmerQualityResponse {
  grade: QualityGrade;
  damage_probability: number;
  explanation: string[];
}

export interface CustomerQualityRequest {
  weight: number;
}

export interface CustomerQualityResponse {
  color: string;
  variety: string;
  ripen_days: number;
  grade: QualityGrade;
  average_temperature: number;
}

// Market Price Types
export type CultivationMethod = 'Organic' | 'Inorganic';

export interface MarketPriceRequest {
  district: District;
  variety: PapayaVariety;
  cultivation_method: CultivationMethod;
  quality_grade: QualityGrade;
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

// Leaf Disease Types
export type DiseaseType = 'Anthracnose' | 'Curl' | 'Healthy' | 'Mite disease' | 'Ringspot' | 'NotPapaya';
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
