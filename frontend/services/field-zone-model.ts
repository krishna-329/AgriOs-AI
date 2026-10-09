import { FIELD_RULES, moistureTrend } from "@/services/field-monitor-rules";
import type { SensorReading } from "@/types/sensor";

export type FieldZoneStatus =
  | "Healthy"
  | "Monitor"
  | "Stress"
  | "Critical"
  | "Sensor Issue"
  | "Awaiting Data";

export type FieldZone = {
  id: string;
  label: string;
  path: string;
  labelX: number;
  labelY: number;
  status: FieldZoneStatus;
  moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  sensorQuality: SensorReading["sensor_status"] | null;
  lastUpdated: string | null;
  reason: string;
  action: string;
  timing: string;
};

type ZoneTemplate = Pick<
  FieldZone,
  "id" | "label" | "path" | "labelX" | "labelY"
> & {
  moistureOffset: number;
  temperatureOffset: number;
  humidityOffset: number;
};

// Geometry and offsets are fixed so the same field reading always produces the
// same illustrative parcel. These are estimates, not extra physical sensors.
const ZONE_TEMPLATES: ZoneTemplate[] = [
  {
    id: "zone-a",
    label: "Zone A",
    path: "M36 36 L247 24 L260 166 L44 181 Z",
    labelX: 146,
    labelY: 105,
    moistureOffset: 0,
    temperatureOffset: 0,
    humidityOffset: 0,
  },
  {
    id: "zone-b",
    label: "Zone B",
    path: "M267 25 L484 43 L467 172 L264 166 Z",
    labelX: 368,
    labelY: 107,
    moistureOffset: -2.2,
    temperatureOffset: 0.4,
    humidityOffset: -1.2,
  },
  {
    id: "zone-c",
    label: "Zone C",
    path: "M491 45 L726 31 L710 185 L472 173 Z",
    labelX: 596,
    labelY: 112,
    moistureOffset: 1.8,
    temperatureOffset: -0.3,
    humidityOffset: 0.8,
  },
  {
    id: "zone-d",
    label: "Zone D",
    path: "M45 188 L259 172 L249 342 L30 324 Z",
    labelX: 145,
    labelY: 260,
    moistureOffset: -4.3,
    temperatureOffset: 0.7,
    humidityOffset: -2.1,
  },
  {
    id: "zone-e",
    label: "Zone E",
    path: "M264 173 L468 179 L487 338 L255 343 Z",
    labelX: 370,
    labelY: 260,
    moistureOffset: 3.1,
    temperatureOffset: -0.6,
    humidityOffset: 1.4,
  },
  {
    id: "zone-f",
    label: "Zone F",
    path: "M473 180 L710 192 L730 322 L493 338 Z",
    labelX: 603,
    labelY: 260,
    moistureOffset: -6.1,
    temperatureOffset: 1,
    humidityOffset: -3,
  },
];

export const FIELD_ZONE_COLORS: Record<FieldZoneStatus, string> = {
  Healthy: "#2f9e44",
  Monitor: "#eab308",
  Stress: "#f97316",
  Critical: "#dc2626",
  "Sensor Issue": "#7c3aed",
  "Awaiting Data": "#94a3b8",
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number) {
  return Number(value.toFixed(1));
}

function explainZone({
  moisture,
  temperature,
  humidity,
  sensorHealthy,
  stale,
  declining,
  validationIssues,
}: {
  moisture: number;
  temperature: number;
  humidity: number;
  sensorHealthy: boolean;
  stale: boolean;
  declining: boolean;
  validationIssues: string[];
}): Pick<FieldZone, "status" | "reason" | "action" | "timing"> {
  if (!sensorHealthy)
    return {
      status: "Sensor Issue",
      reason: validationIssues.some(
        (issue) => issue.includes("soil_moisture") && issue.includes("jump"),
      )
        ? "Sudden soil-moisture jump detected. Verify the sensor."
        : validationIssues[0]?.replaceAll("_", " ") ||
          "The latest field reading is unreliable. Verify the sensor.",
      action: "Verify the sensor stream before acting on these values.",
      timing: "Before the next field decision",
    };
  if (stale)
    return {
      status: "Monitor",
      reason: "The latest stored field reading is more than one minute old.",
      action: "Check the field stream before assessing current conditions.",
      timing: "During the next monitoring cycle",
    };
  if (moisture < FIELD_RULES.criticalMoistureBelow)
    return {
      status: "Critical",
      reason: "Soil moisture is below the prototype critical threshold of 20%.",
      action: "Inspect field conditions and irrigation need promptly.",
      timing: "As soon as practical",
    };
  if (moisture < FIELD_RULES.stressMoistureBelow)
    return {
      status: "Stress",
      reason: "Soil moisture is below the prototype healthy range.",
      action: "Inspect irrigation need.",
      timing: "Today",
    };
  if (moisture < FIELD_RULES.monitorMoistureBelow)
    return {
      status: "Monitor",
      reason: "Soil moisture is near the lower edge of the prototype range.",
      action: "Monitor moisture and inspect the zone if it continues to fall.",
      timing: "During the next monitoring cycle",
    };
  if (moisture > FIELD_RULES.highMoistureAbove)
    return {
      status: "Monitor",
      reason: "Soil moisture is above the broad prototype monitoring range.",
      action: "Inspect current soil and drainage conditions.",
      timing: "During the next monitoring cycle",
    };
  if (declining)
    return {
      status: "Monitor",
      reason: "Stored field readings show a declining moisture trend.",
      action: "Continue close monitoring across the field.",
      timing: "During the next monitoring cycle",
    };
  if (
    temperature >= FIELD_RULES.highTemperatureAt ||
    humidity < FIELD_RULES.lowHumidityBelow
  )
    return {
      status: "Monitor",
      reason:
        temperature >= FIELD_RULES.highTemperatureAt
          ? "Temperature is at least 35°C and warrants closer monitoring."
          : "Humidity is below 40% and warrants closer monitoring.",
      action: "Inspect current crop and soil conditions.",
      timing: "During the next monitoring cycle",
    };
  return {
    status: "Healthy",
    reason: "Current values are within the broad prototype monitoring range.",
    action: "Continue routine monitoring.",
    timing: "At the next scheduled check",
  };
}

export function deriveIllustrativeZones(
  readings: SensorReading[],
): FieldZone[] {
  const latest = readings.at(-1);
  if (!latest)
    return ZONE_TEMPLATES.map((template) => ({
      ...template,
      status: "Awaiting Data",
      moisture: null,
      temperature: null,
      humidity: null,
      sensorQuality: null,
      lastUpdated: null,
      reason: "No current sensor reading is available for this field.",
      action: "Start the prototype sensor stream to assess current conditions.",
      timing: "When a new reading is available",
    }));
  const declining = moistureTrend(readings).direction === "declining";
  const stale =
    Date.now() - Date.parse(latest.recorded_at) >
    FIELD_RULES.staleReadingAfterMs;

  return ZONE_TEMPLATES.map((template) => {
    const moisture = round(
      clamp(latest.soil_moisture + template.moistureOffset, 0, 100),
    );
    const temperature = round(
      clamp(latest.temperature + template.temperatureOffset, -20, 60),
    );
    const humidity = round(
      clamp(latest.humidity + template.humidityOffset, 0, 100),
    );
    const assessment = explainZone({
      moisture,
      temperature,
      humidity,
      sensorHealthy: latest.sensor_status === "healthy",
      stale,
      declining,
      validationIssues: latest.validation_issues,
    });
    return {
      ...template,
      ...assessment,
      moisture,
      temperature,
      humidity,
      sensorQuality: latest.sensor_status,
      lastUpdated: latest.recorded_at,
    };
  });
}

export function aggregateFieldStatus(zones: FieldZone[]) {
  if (!zones.length || zones.every((zone) => zone.status === "Awaiting Data"))
    return {
      label: "Awaiting Data" as const,
      detail: "No current sensor reading is available for this field.",
    };
  const counts = (status: FieldZoneStatus) =>
    zones.filter((zone) => zone.status === status).length;
  if (counts("Sensor Issue"))
    return {
      label: "Sensor Issue" as const,
      detail:
        "The current field stream is unreliable, so illustrative zones show Sensor Issue instead of crop condition status.",
    };
  if (counts("Critical"))
    return {
      label: "Critical" as const,
      detail:
        "At least one illustrative zone is below the 20% moisture threshold.",
    };
  if (counts("Stress") + counts("Critical") >= 2)
    return {
      label: "Stress" as const,
      detail:
        "Two or more illustrative zones are below the 30% moisture threshold.",
    };
  if (zones.some((zone) => zone.status !== "Healthy"))
    return {
      label: "Monitor" as const,
      detail:
        "At least one illustrative zone needs closer monitoring, but field-wide stress is not indicated.",
    };
  return {
    label: "Healthy" as const,
    detail: "All illustrative zones are within the broad prototype range.",
  };
}
