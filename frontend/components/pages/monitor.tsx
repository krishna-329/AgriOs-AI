"use client";
import {
  Droplets,
  Thermometer,
  Wind,
  CloudRain,
  Pause,
  Play,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard-provider";
import { EmptyState, SensorCard, StatusBadge } from "@/components/cards";
import { ChartCard } from "@/components/chart-card";
import { PageHeading } from "@/components/page-heading";
export default function Monitor() {
  const { data, error, readings, running, setRunning } = useDashboard();
  if (!data || !readings.length)
    return <EmptyState message={error || "Loading simulated readings…"} />;
  const latest = readings.at(-1)!;
  return (
    <>
      <PageHeading
        eyebrow="CONNECTED TO YOUR FIELD"
        title="A pulse on your growing season."
        description="Field 1 · Simulated IoT Data, never physical sensor measurements."
      >
        <button className="button" onClick={() => setRunning(!running)}>
          {running ? <Pause size={16} /> : <Play size={16} />}{" "}
          {running ? "Pause simulation" : "Start simulation"}
        </button>
      </PageHeading>
      <div className="simulation-banner">
        <span className={`live-dot ${running ? "running" : ""}`} />
        <strong>{running ? "Simulation running" : "Simulation paused"}</strong>
        <span>New example reading every 2.5 seconds while running.</span>
      </div>
      <div className="stats-grid">
        <SensorCard
          title="Soil moisture"
          value={`${latest.moisture}%`}
          detail="Simulated · Field 1"
          icon={Droplets}
          tone="warning"
        />
        <SensorCard
          title="Temperature"
          value={`${latest.temperature}°C`}
          detail="Simulated · Air temperature"
          icon={Thermometer}
        />
        <SensorCard
          title="Humidity"
          value={`${latest.humidity}%`}
          detail="Simulated · Relative humidity"
          icon={Wind}
        />
        <SensorCard
          title="Rainfall"
          value="0 mm"
          detail="Mock forecast · No rain expected"
          icon={CloudRain}
        />
      </div>
      <div className="monitor-alert">
        <StatusBadge tone="warning">Possible water stress</StatusBadge>
        <div>
          <h3>
            {latest.moisture < 23
              ? "Moisture has fallen below the demo threshold."
              : "Soil moisture is trending down."}
          </h3>
          <p>
            Why: the simulated field is gradually drying. Check actual soil
            conditions before deciding whether to irrigate.
          </p>
          <strong>When: tomorrow morning · Illustrative alert</strong>
        </div>
      </div>
      <div className="two-column">
        <ChartCard
          title="Soil moisture"
          description="Field 1 · Gradual drying scenario"
          data={readings}
        />
        <ChartCard
          title="Air temperature"
          description="Field 1 · Sample temperature trend"
          data={readings}
          metric="temperature"
          unit="°C"
          color="#bd8a46"
        />
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Sensor quality</h2>
          <StatusBadge tone="normal">Example stream available</StatusBadge>
        </div>
        <p className="muted">
          These readings are generated in your browser. Device validation,
          anomaly detection and physical sensor connectivity are future
          integrations.
        </p>
      </section>
    </>
  );
}
