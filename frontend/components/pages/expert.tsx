"use client";
import { useState } from "react";
import { useDashboard } from "@/components/dashboard-provider";
import { ChartCard } from "@/components/chart-card";
import { EmptyState } from "@/components/cards";
import { PageHeading } from "@/components/page-heading";
export default function Expert() {
  const { data, error, readings, sampleId } = useDashboard();
  const [metric, setMetric] = useState<"moisture" | "temperature" | "humidity">(
    "moisture",
  );
  if (!data) return <EmptyState message={error || "Loading analytics…"} />;
  const sample = data.storageSamples.find((s) => s.id === sampleId)!;
  return (
    <>
      <PageHeading
        eyebrow="A CLOSER LOOK"
        title="See the story behind the action."
        description="Inspect example outputs, source labels and the simulated reading history."
      />
      <div className="analytics-notice">
        Model evaluation pending. Every value on this page is a mock output or
        simulated reading.
      </div>
      <div className="two-column">
        <section className="panel">
          <div className="section-heading">
            <h2>Model output preview</h2>
            <span className="pill neutral">Mock only</span>
          </div>
          <div className="model-row">
            <div>
              <strong>Crop suitability</strong>
              <small>Example output · Not a trained model</small>
            </div>
            <span>Maize · Good fit</span>
          </div>
          <div className="model-row">
            <div>
              <strong>Yield estimate</strong>
              <small>Fixed fixture · No uncertainty estimate</small>
            </div>
            <span>5.2 t / ha</span>
          </div>
          <div className="model-row">
            <div>
              <strong>Acoustic classifier</strong>
              <small>Example confidence · Uncalibrated</small>
            </div>
            <span>
              {sample.acousticConfidence === null
                ? "Inconclusive"
                : `${sample.acousticConfidence}% mock`}
            </span>
          </div>
          <div className="model-row">
            <div>
              <strong>Model version</strong>
              <small>No inference artifacts loaded</small>
            </div>
            <span>Unavailable</span>
          </div>
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Data provenance</h2>
          </div>
          {[
            ["Farm, soil & resources", "Mock data"],
            ["Weather summary", "Mock data · No weather API"],
            ["Field readings", "Simulated IoT Data"],
            ["Grain audio result", "Mock data · No audio inference"],
          ].map(([label, source]) => (
            <div className="model-row" key={label}>
              <strong>{label}</strong>
              <small>{source}</small>
            </div>
          ))}
        </section>
      </div>
      <div className="section-heading standalone">
        <h2>Sensor history</h2>
        <label className="inline-label">
          Metric
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as typeof metric)}
          >
            <option value="moisture">Soil moisture</option>
            <option value="temperature">Temperature</option>
            <option value="humidity">Humidity</option>
          </select>
        </label>
      </div>
      <ChartCard
        title={
          metric === "moisture"
            ? "Soil moisture"
            : metric === "temperature"
              ? "Temperature"
              : "Relative humidity"
        }
        description="Latest simulated readings · Session only"
        metric={metric}
        unit={metric === "temperature" ? "°C" : "%"}
        data={readings}
      />
      <section className="panel">
        <div className="section-heading">
          <h2>Reading log</h2>
          <span className="muted">Latest 8 observations</span>
        </div>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Simulated sensor readings</caption>
            <thead>
              <tr>
                <th>Time / sample</th>
                <th>Moisture</th>
                <th>Temperature</th>
                <th>Humidity</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {readings.slice(-8).map((r, i) => (
                <tr key={`${r.time}-${i}`}>
                  <td>{r.time}</td>
                  <td>{r.moisture}%</td>
                  <td>{r.temperature}°C</td>
                  <td>{r.humidity}%</td>
                  <td>
                    <span className="pill neutral">Simulated IoT Data</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
