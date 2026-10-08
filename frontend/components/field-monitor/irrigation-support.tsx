"use client";
import { CloudRain, Droplets, Thermometer } from "lucide-react";
import { useWeather } from "@/components/weather-provider";
import { irrigationAssessment } from "@/services/field-monitor-rules";
import type { FarmProfile } from "@/types/farm-profile";
import type { SensorReading } from "@/types/sensor";

export function IrrigationSupport({
  farm,
  readings,
}: {
  farm: FarmProfile | null;
  readings: SensorReading[];
}) {
  const { weather, status: weatherStatus } = useWeather();
  const result = irrigationAssessment({
    farm,
    readings,
    weather,
    weatherStatus,
  });
  const color =
    result.tone === "healthy"
      ? "#15803d"
      : result.tone === "action"
        ? "#b91c1c"
        : result.tone === "warning"
          ? "#b45309"
          : "#475569";
  const trendText =
    result.data.trend.direction === "insufficient"
      ? "Insufficient history"
      : `${result.data.trend.direction} (${result.data.trend.change > 0 ? "+" : ""}${result.data.trend.change} points)`;

  return (
    <section className="field-tab-view" aria-labelledby="irrigation-title">
      <div className="field-tab-heading">
        <div>
          <h2 id="irrigation-title">Irrigation Support</h2>
          <p>
            Transparent prototype guidance for{" "}
            {farm?.name || "the selected farm"}
          </p>
        </div>
        <span>Rule-based · Not an agronomic prescription</span>
      </div>

      <div className="irrigation-layout">
        <article
          className="panel irrigation-recommendation"
          style={{ borderTopColor: color }}
        >
          <small>CURRENT RECOMMENDATION</small>
          <h3 style={{ color }}>{result.state}</h3>
          <dl>
            <div>
              <dt>WHAT</dt>
              <dd>{result.what}</dd>
            </div>
            <div>
              <dt>WHY</dt>
              <dd>{result.why}</dd>
            </div>
            <div>
              <dt>WHEN</dt>
              <dd>{result.when}</dd>
            </div>
          </dl>
          <p className="field-rule-note">
            No water quantity is estimated. Confirm actual field conditions
            before irrigation.
          </p>
        </article>

        <article className="panel irrigation-data">
          <h3>Data Used</h3>
          <div className="irrigation-data-grid">
            <div>
              <Droplets size={18} />
              <span>Soil moisture</span>
              <strong>
                {result.data.moisture == null
                  ? "Not available"
                  : `${result.data.moisture}%`}
              </strong>
            </div>
            <div>
              <Droplets size={18} />
              <span>Moisture trend</span>
              <strong>{trendText}</strong>
            </div>
            <div>
              <CloudRain size={18} />
              <span>Rain forecast</span>
              <strong>
                {weatherStatus === "error"
                  ? "Weather data temporarily unavailable"
                  : result.data.rainChance == null
                    ? "Not available"
                    : `${result.data.rainChance}% max`}
              </strong>
            </div>
            <div>
              <Thermometer size={18} />
              <span>Temperature / humidity</span>
              <strong>
                {result.data.temperature == null
                  ? "Not available"
                  : `${result.data.temperature}°C / ${result.data.humidity}%`}
              </strong>
            </div>
            <div>
              <Droplets size={18} />
              <span>Irrigation type</span>
              <strong>{result.data.irrigationType || "Not available"}</strong>
            </div>
            <div>
              <LeafIcon />
              <span>Current crop</span>
              <strong>{result.data.crop || "Not available"}</strong>
            </div>
          </div>
          {weatherStatus === "loading" && (
            <p className="field-muted">Loading near-live weather…</p>
          )}
          {weatherStatus === "missing-location" && (
            <p className="field-muted">
              Weather data temporarily unavailable — add farm coordinates.
            </p>
          )}
        </article>
      </div>

      <article className="panel irrigation-rules">
        <h3>Prototype Rules</h3>
        <p>
          Moisture below 30% with rain chance below 50% → Irrigation
          recommended. Low moisture with rain chance at least 50% → Monitor.
          Healthy moisture with meaningful rain expected → No irrigation needed.
          A fall of at least 4 points across recent healthy readings, moisture
          below 35%, temperature at least 35°C, or humidity below 40% → Monitor.
          Suspicious sensors or unavailable weather block a strong
          recommendation.
        </p>
      </article>
    </section>
  );
}

function LeafIcon() {
  return (
    <span aria-hidden="true" style={{ color: "#15803d", fontSize: 18 }}>
      ●
    </span>
  );
}
