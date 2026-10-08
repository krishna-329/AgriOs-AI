export type SensorReading = {
  id: string;
  farm_id: string;
  field_id: string;
  soil_moisture: number;
  temperature: number;
  humidity: number;
  source: string;
  recorded_at: string;
  timestamp: string;
  sensor_status: "healthy" | "suspicious" | "invalid";
  validation_issues: string[];
};
