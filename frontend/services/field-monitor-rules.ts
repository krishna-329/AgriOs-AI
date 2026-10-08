import type { FarmProfile } from "@/types/farm-profile";
import type { SensorReading } from "@/types/sensor";
import type { WeatherResponse } from "@/types/weather";

export const FIELD_RULES = {
  criticalMoistureBelow: 20,
  stressMoistureBelow: 30,
  monitorMoistureBelow: 35,
  highMoistureAbove: 80,
  decliningPoints: 4,
  highTemperatureAt: 35,
  lowHumidityBelow: 40,
  meaningfulRainAt: 50,
  staleReadingAfterMs: 60_000,
} as const;

export function moistureTrend(readings: SensorReading[]) {
  const recent = readings
    .filter((reading) => reading.sensor_status === "healthy")
    .slice(-6);
  if (recent.length < 3)
    return { direction: "insufficient" as const, change: 0 };
  const change = Number(
    (recent.at(-1)!.soil_moisture - recent[0].soil_moisture).toFixed(1),
  );
  return {
    direction:
      change <= -FIELD_RULES.decliningPoints
        ? ("declining" as const)
        : change >= FIELD_RULES.decliningPoints
          ? ("rising" as const)
          : ("stable" as const),
    change,
  };
}

export function soilAssessment(
  farm: FarmProfile | null,
  readings: SensorReading[],
) {
  const latest = readings.at(-1);
  if (!latest)
    return {
      label: "Sensor data required",
      detail: "No simulated sensor readings available yet",
      tone: "neutral" as const,
    };
  if (latest.sensor_status !== "healthy")
    return {
      label: "Sensor issue",
      detail: "Verify the sensor stream before assessing soil condition.",
      tone: "warning" as const,
    };
  if (
    latest.soil_moisture < FIELD_RULES.stressMoistureBelow ||
    latest.soil_moisture > FIELD_RULES.highMoistureAbove
  )
    return {
      label: "Needs attention",
      detail: `Soil moisture is ${latest.soil_moisture < FIELD_RULES.stressMoistureBelow ? "below" : "above"} the prototype monitoring range.`,
      tone: "warning" as const,
    };
  if (farm?.soil_ph != null && (farm.soil_ph < 5.5 || farm.soil_ph > 8))
    return {
      label: "Review soil condition",
      detail: "Recorded pH is outside the broad prototype range of 5.5–8.0.",
      tone: "warning" as const,
    };
  const missingTest = [
    farm?.soil_ph,
    farm?.nitrogen,
    farm?.phosphorus,
    farm?.potassium,
  ].some((value) => value == null);
  if (missingTest)
    return {
      label: "Soil test required",
      detail: "Soil test data not available",
      tone: "neutral" as const,
    };
  return {
    label: "Healthy",
    detail: "Moisture and recorded pH are within broad prototype ranges.",
    tone: "healthy" as const,
  };
}

export type WeatherAvailability =
  "loading" | "ready" | "error" | "missing-location";

export function irrigationAssessment({
  farm,
  readings,
  weather,
  weatherStatus,
}: {
  farm: FarmProfile | null;
  readings: SensorReading[];
  weather: WeatherResponse | null;
  weatherStatus: WeatherAvailability;
}) {
  const latest = readings.at(-1);
  const trend = moistureTrend(readings);
  const probabilities = weather
    ? [
        weather.rain_probability,
        ...weather.forecast.slice(0, 2).map((day) => day.rain_probability),
      ].filter((value): value is number => value != null)
    : [];
  const rainChance = probabilities.length ? Math.max(...probabilities) : null;
  const data = {
    moisture: latest?.soil_moisture ?? null,
    trend,
    rainChance,
    temperature: latest?.temperature ?? null,
    humidity: latest?.humidity ?? null,
    irrigationType: farm?.irrigation_type ?? null,
    crop: farm?.current_crop ?? null,
  };

  if (!latest)
    return {
      state: "INSUFFICIENT DATA",
      what: "Start the prototype sensor stream",
      why: "No simulated sensor readings are available for this farm.",
      when: "Generate readings before assessing irrigation need",
      tone: "neutral" as const,
      data,
    };
  if (latest.sensor_status !== "healthy")
    return {
      state: "SENSOR ISSUE",
      what: "Verify the sensor stream",
      why: "The latest reading is suspicious, so it cannot support a strong irrigation recommendation.",
      when: "Check the prototype sensor before taking action",
      tone: "warning" as const,
      data,
    };
  if (weatherStatus !== "ready" || !weather || rainChance == null)
    return {
      state: "INSUFFICIENT DATA",
      what: "Inspect soil moisture and weather",
      why: "Weather data temporarily unavailable",
      when: "Review again when near-live weather is available",
      tone: "neutral" as const,
      data,
    };

  const meaningfulRain = rainChance >= FIELD_RULES.meaningfulRainAt;
  const lowMoisture = latest.soil_moisture < FIELD_RULES.stressMoistureBelow;
  const hotDrySupport =
    latest.temperature >= FIELD_RULES.highTemperatureAt ||
    latest.humidity < FIELD_RULES.lowHumidityBelow;

  if (lowMoisture && !meaningfulRain)
    return {
      state: "IRRIGATION RECOMMENDED",
      what: "Inspect irrigation need",
      why: "Soil moisture is low and meaningful rainfall is unlikely.",
      when:
        latest.soil_moisture < FIELD_RULES.criticalMoistureBelow
          ? "Inspect/irrigate soon"
          : "Inspect the field today",
      tone: "action" as const,
      data,
    };
  if (lowMoisture && meaningfulRain)
    return {
      state: "MONITOR",
      what: "Monitor moisture and incoming rain",
      why: "Soil moisture is low, but meaningful rainfall is forecast.",
      when: "Recheck after rainfall or within the next monitoring cycle",
      tone: "warning" as const,
      data,
    };
  if (meaningfulRain)
    return {
      state: "NO IRRIGATION NEEDED",
      what: "Continue monitoring",
      why: "Soil moisture is within the prototype range and meaningful rainfall is forecast.",
      when: "Recheck after the forecast period",
      tone: "healthy" as const,
      data,
    };
  if (
    trend.direction === "declining" ||
    latest.soil_moisture < FIELD_RULES.monitorMoistureBelow ||
    hotDrySupport
  )
    return {
      state: "MONITOR",
      what: "Inspect irrigation need",
      why:
        trend.direction === "declining"
          ? "Soil moisture is declining and meaningful rainfall is unlikely."
          : "Current moisture, temperature, or humidity warrants closer monitoring.",
      when: "Inspect the field during the next monitoring cycle",
      tone: "warning" as const,
      data,
    };
  return {
    state: "NO IRRIGATION NEEDED",
    what: "Continue monitoring",
    why: "Soil moisture is within the prototype range with no immediate stress signal.",
    when: "Review during the next monitoring cycle",
    tone: "healthy" as const,
    data,
  };
}
