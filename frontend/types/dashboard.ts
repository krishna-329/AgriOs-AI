export type Tone = "normal" | "warning" | "urgent";
export type Source = "Mock data" | "Simulated IoT Data";
export interface FarmProfile {
  id: string;
  name: string;
  farmer: string;
  location: string;
  areaHa: number;
  crop: string;
  season: string;
  daysAfterSowing: number;
  source: Source;
}
export interface WeatherSummary {
  temperature: number;
  humidity: number;
  rainfallMm: number;
  condition: string;
  source: Source;
}
export interface ResourceBudget {
  id: string;
  name: string;
  used: number;
  available: number;
  unit: string;
}
export interface SensorReading {
  time: string;
  moisture: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  source: Source;
}
export interface CropRecommendation {
  id: string;
  name: string;
  variety: string;
  suitability: string;
  yieldTonnesHa: number;
  profitInrHa: number;
  waterM3Ha: number;
  costInrHa: number;
  reason: string;
  source: Source;
}
export interface RiskEvent {
  id: string;
  module: "Field" | "Storage" | "Crop";
  severity: Tone;
  priority: number;
  what: string;
  why: string;
  action: string;
  when: string;
  source: Source;
}
export interface StorageAnalysis {
  id: string;
  label: string;
  activity: string;
  acousticConfidence: number | null;
  temperature: number;
  humidity: number;
  moisture: number;
  risk: Tone;
  action: string;
  source: Source;
}
export interface DashboardSnapshot {
  farm: FarmProfile;
  weather: WeatherSummary;
  resources: ResourceBudget[];
  readings: SensorReading[];
  risks: RiskEvent[];
  crops: CropRecommendation[];
  storageSamples: StorageAnalysis[];
}
