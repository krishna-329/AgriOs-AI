import type { SensorReading } from "@/types/sensor";

const base = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export type SimulationScenario = "normal" | "water_stress" | "sensor_failure";

async function sensorRequest<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}/api/sensors${path}`, {
      ...options,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...options.headers },
      signal: options.signal || AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error("Simulation temporarily unavailable");
  }
  if (!response.ok) {
    throw new Error("Simulation temporarily unavailable");
  }
  return response.json() as Promise<T>;
}

export async function getSensorHistory(
  farmId: string,
  fieldId: string,
  signal: AbortSignal,
): Promise<SensorReading[]> {
  const params = new URLSearchParams({
    farm_id: farmId,
    field_id: fieldId,
    limit: "100",
  });
  const response = await fetch(`${base}/api/sensors/history?${params}`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Sensor readings temporarily unavailable");
  const data: SensorReading[] = await response.json();
  if (
    !Array.isArray(data) ||
    data.some(
      (r) =>
        r.farm_id !== farmId ||
        r.field_id !== fieldId ||
        ![r.soil_moisture, r.temperature, r.humidity].every(Number.isFinite) ||
        r.soil_moisture < 0 ||
        r.soil_moisture > 100 ||
        r.temperature < -20 ||
        r.temperature > 60 ||
        r.humidity < 0 ||
        r.humidity > 100 ||
        !Number.isFinite(Date.parse(r.recorded_at)) ||
        typeof r.source !== "string" ||
        !["healthy", "suspicious", "invalid"].includes(r.sensor_status) ||
        !Array.isArray(r.validation_issues) ||
        r.validation_issues.some((issue) => typeof issue !== "string"),
    )
  )
    throw new Error("Invalid sensor response");
  return data.sort(
    (a, b) => Date.parse(a.recorded_at) - Date.parse(b.recorded_at),
  );
}

export function simulateSensorTick(
  farmId: string,
  fieldId: string,
  scenario: SimulationScenario,
): Promise<SensorReading> {
  return sensorRequest<SensorReading>("/simulate-tick", {
    method: "POST",
    body: JSON.stringify({ farm_id: farmId, field_id: fieldId, scenario }),
  });
}

export function resetDemoReadings(
  farmId: string,
  fieldId: string,
): Promise<{ deleted_count: number }> {
  return sensorRequest<{ deleted_count: number }>("/reset-demo", {
    method: "POST",
    body: JSON.stringify({ farm_id: farmId, field_id: fieldId }),
  });
}
