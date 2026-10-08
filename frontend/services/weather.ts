import type { WeatherResponse } from "@/types/weather";
const base = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");
async function request<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${base}${path}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Weather temporarily unavailable");
  return response.json() as Promise<T>;
}
export async function getWeather(
  farm: { id: string; latitude: number; longitude: number },
  signal: AbortSignal,
): Promise<WeatherResponse> {
  const params = new URLSearchParams({
    farm_id: farm.id,
    latitude: String(farm.latitude),
    longitude: String(farm.longitude),
  });
  const data = await request<WeatherResponse>(`/api/weather?${params}`, signal);
  if (
    data.source !== "weather_api" ||
    !Number.isFinite(data.temperature) ||
    !Number.isFinite(data.humidity) ||
    !Number.isFinite(data.wind_speed) ||
    !Array.isArray(data.forecast) ||
    !Number.isFinite(Date.parse(data.timestamp))
  )
    throw new Error("Invalid weather response");
  return data;
}
