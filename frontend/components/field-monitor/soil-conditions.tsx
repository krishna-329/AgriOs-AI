"use client";
import { Droplets, Leaf, TestTube } from "lucide-react";
import { EmptyState } from "@/components/cards";
import { SensorHistoryChart } from "@/components/sensor-history-chart";
import { soilAssessment } from "@/services/field-monitor-rules";
import type { FarmProfile } from "@/types/farm-profile";
import type { SensorReading } from "@/types/sensor";

function displayTest(value: number | null | undefined, unit = "") {
  return value == null
    ? { value: "Not available", detail: "Add soil test data" }
    : { value: `${value}${unit}`, detail: "Farm soil test" };
}

export function SoilConditions({
  farm,
  readings,
}: {
  farm: FarmProfile | null;
  readings: SensorReading[];
}) {
  const latest = readings.at(-1);
  const assessment = soilAssessment(farm, readings);
  const cards = [
    {
      label: "Soil Moisture",
      ...(!latest
        ? {
            value: "Not available",
            detail: "No simulated sensor readings available yet",
          }
        : {
            value: `${latest.soil_moisture}%`,
            detail: `Simulated reading · ${latest.sensor_status}`,
          }),
    },
    { label: "pH", ...displayTest(farm?.soil_ph) },
    { label: "Nitrogen", ...displayTest(farm?.nitrogen, " kg/ha") },
    { label: "Phosphorus", ...displayTest(farm?.phosphorus, " kg/ha") },
    { label: "Potassium", ...displayTest(farm?.potassium, " kg/ha") },
    {
      label: "Soil Type",
      value: farm?.soil_type || "Not available",
      detail: farm?.soil_type ? "Farm profile" : "Add farm soil information",
    },
  ];
  const tone =
    assessment.tone === "healthy"
      ? "#15803d"
      : assessment.tone === "warning"
        ? "#b45309"
        : "#475569";

  return (
    <section className="field-tab-view" aria-labelledby="soil-conditions-title">
      <div className="field-tab-heading">
        <div>
          <h2 id="soil-conditions-title">Soil Conditions</h2>
          <p>
            {farm?.current_crop ? `${farm.current_crop} · ` : ""}Selected farm
            profile and stored prototype readings
          </p>
        </div>
        <span>Rule-based prototype assessment</span>
      </div>

      <div className="soil-condition-grid">
        {cards.map((card, index) => (
          <article className="soil-condition-card" key={card.label}>
            <span className="soil-card-icon">
              {index === 0 ? (
                <Droplets size={19} />
              ) : index === 5 ? (
                <Leaf size={19} />
              ) : (
                <TestTube size={19} />
              )}
            </span>
            <div>
              <small>{card.label}</small>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </div>
          </article>
        ))}
      </div>

      {[farm?.soil_ph, farm?.nitrogen, farm?.phosphorus, farm?.potassium].some(
        (value) => value == null,
      ) && (
        <p className="soil-missing-note">
          Soil test data not available — missing values are never estimated.
        </p>
      )}

      <div className="field-tab-split">
        <article className="panel soil-status-panel">
          <small>SOIL STATUS</small>
          <h3 style={{ color: tone }}>{assessment.label}</h3>
          <p>{assessment.detail}</p>
          {latest && (
            <p className="field-muted">
              Latest temperature {latest.temperature}°C · Humidity{" "}
              {latest.humidity}% · Sensor quality {latest.sensor_status}
            </p>
          )}
          <p className="field-rule-note">
            Rules: moisture below 30% or above 80% needs attention; recorded pH
            outside 5.5–8.0 needs review; missing pH/NPK requires a soil test.
          </p>
        </article>
        <article className="panel soil-history-panel">
          <h3>Soil Moisture History</h3>
          {readings.length >= 2 ? (
            <div
              className="soil-moisture-chart"
              role="img"
              aria-label="Stored soil moisture history for selected farm"
            >
              <SensorHistoryChart readings={readings} metric="soil_moisture" />
            </div>
          ) : readings.length === 0 ? (
            <EmptyState message="No simulated sensor readings available yet" />
          ) : (
            <EmptyState message="More readings are needed to show a moisture trend" />
          )}
        </article>
      </div>
    </section>
  );
}
