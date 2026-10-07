export interface ForecastDay {
  date: string;
  temperature_max: number;
  temperature_min: number;
  rain_probability: number | null;
  condition: string;
}
export interface WeatherResponse {
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  rain_probability: number | null;
  rain_probability_period: "today";
  wind_speed: number;
  condition: string;
  source: "weather_api";
  provider: string;
  timestamp: string;
  timezone: string;
  temperature_unit: "°C";
  wind_speed_unit: "km/h";
  forecast: ForecastDay[];
}
