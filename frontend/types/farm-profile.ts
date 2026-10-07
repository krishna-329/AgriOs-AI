export interface FarmProfileInput {
  name: string;
  farmer_name: string | null;
  location_name: string | null;
  district: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  area_acres: number | null;
  soil_type: string | null;
  soil_ph: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  irrigation_type: string | null;
  water_availability: number | null;
  current_crop: string | null;
  crop_variety: string | null;
  sowing_date: string | null;
  budget: number | null;
}
export interface FarmProfile extends FarmProfileInput {
  id: string;
  created_at: string;
  updated_at: string;
}
