export type FarmInput = {
  farmer_name: string;
  name: string;
  location: string;
  area_ha: number;
  budget_inr: number;
  water_m3: number;
  fertilizer_kg: number;
  season: "kharif" | "rabi" | "zaid";
  current_crop?: string | null;
};
export type Farm = FarmInput & {
  id: string;
  created_at: string;
  data_source: "farmer_input";
};
