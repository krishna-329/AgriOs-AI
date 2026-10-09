"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Droplets, Thermometer, Activity, Leaf } from "lucide-react";
import { useSensorHistory } from "@/components/use-sensor-history";
import { SensorHistoryChart } from "@/components/sensor-history-chart";
import { FieldZoneMap } from "@/components/field-monitor/field-zone-map";
import { SoilConditions } from "@/components/field-monitor/soil-conditions";
import { IrrigationSupport } from "@/components/field-monitor/irrigation-support";
import {
  resetDemoReadings,
  simulateSensorTick,
  type SimulationScenario,
} from "@/services/sensors";
import {
  aggregateFieldStatus,
  deriveIllustrativeZones,
} from "@/services/field-zone-model";
import type { SensorReading } from "@/types/sensor";
import { EmptyState } from "@/components/cards";

export default function Monitor() {
  const { readings, latest, message, selectedFarm, refresh } =
    useSensorHistory();
  const [activeTab, setActiveTab] = useState("map");
  const [scenario, setScenario] = useState<SimulationScenario>("normal");
  const [simulationState, setSimulationState] = useState<
    "stopped" | "running" | "error" | "resetting"
  >("stopped");
  const [lastTick, setLastTick] = useState<SensorReading | null>(null);
  const [applyingScenario, setApplyingScenario] =
    useState<SimulationScenario | null>(null);
  const [nextTickAt, setNextTickAt] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);
  const tickInFlightRef = useRef(false);
  const scenarioRef = useRef<SimulationScenario>("normal");
  const fieldId = "field-1";
  const status = aggregateFieldStatus(deriveIllustrativeZones(readings));
  const displayedReading = lastTick || latest;
  const lastReadingAge = displayedReading
    ? Math.max(
        0,
        Math.floor(
          (clockNow - Date.parse(displayedReading.recorded_at)) / 1000,
        ),
      )
    : null;
  const nextUpdateIn =
    nextTickAt == null
      ? null
      : Math.max(0, Math.ceil((nextTickAt - clockNow) / 1000));
  const sensorUnreliable = latest != null && latest.sensor_status !== "healthy";

  const stopSimulation = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setApplyingScenario(null);
    setNextTickAt(null);
    setSimulationState("stopped");
  }, []);

  const generateTick = useCallback(
    async (requestedScenario?: SimulationScenario) => {
      if (!selectedFarm?.id || tickInFlightRef.current) return;
      const tickScenario = requestedScenario || scenarioRef.current;
      tickInFlightRef.current = true;
      try {
        const reading = await simulateSensorTick(
          selectedFarm.id,
          fieldId,
          tickScenario,
        );
        if (runningRef.current) {
          setLastTick(reading);
          await refresh();
          setApplyingScenario((current) =>
            current === tickScenario ? null : current,
          );
        }
      } catch {
        runningRef.current = false;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setApplyingScenario(null);
        setNextTickAt(null);
        setSimulationState("error");
      } finally {
        tickInFlightRef.current = false;
      }
    },
    [refresh, selectedFarm?.id],
  );

  const startSimulation = useCallback(() => {
    if (!selectedFarm?.id || runningRef.current) return;
    runningRef.current = true;
    const startedAt = Date.now();
    const requestedScenario = scenarioRef.current;
    setApplyingScenario(requestedScenario);
    setNextTickAt(startedAt + 5000);
    setSimulationState("running");
    void generateTick(requestedScenario);
    timerRef.current = setInterval(() => {
      setNextTickAt(Date.now() + 5000);
      void generateTick();
    }, 5000);
  }, [generateTick, selectedFarm?.id]);

  const resetReadings = useCallback(async () => {
    if (!selectedFarm?.id) return;
    stopSimulation();
    setSimulationState("resetting");
    try {
      await resetDemoReadings(selectedFarm.id, fieldId);
      setLastTick(null);
      setApplyingScenario(null);
      await refresh();
      setSimulationState("stopped");
    } catch {
      setSimulationState("error");
    }
  }, [refresh, selectedFarm?.id, stopSimulation]);

  useEffect(() => {
    // Farm changes and page navigation stop the browser-owned timer. Any tick
    // already in flight retains the farm ID captured when it began.
    stopSimulation();
    setLastTick(null);
    setApplyingScenario(null);
    return stopSimulation;
  }, [selectedFarm?.id, stopSimulation]);

  useEffect(() => {
    setClockNow(Date.now());
    const clock = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

  const scenarioLabels: Record<SimulationScenario, string> = {
    normal: "Normal",
    water_stress: "Water Stress",
    sensor_failure: "Sensor Failure",
  };
  const chooseScenario = (value: SimulationScenario) => {
    scenarioRef.current = value;
    setScenario(value);
    setApplyingScenario(value);
  };
  return (
    <div
      className="page-container responsive-page responsive-monitor"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Field Monitor</h1>
        <div className="field-monitor-subheading">
          <p style={{ color: "#64748b" }}>
            {latest
              ? `Stored reading · Recorded ${new Date(latest.recorded_at).toLocaleString()}`
              : "Current field conditions and transparent prototype guidance"}
          </p>
          <details className="prototype-disclosure">
            <summary>Prototype Data ⓘ</summary>
            <p>
              Sensor readings in this prototype are generated through the same
              ingestion pipeline designed for physical IoT devices.
            </p>
          </details>
        </div>
      </div>

      <section
        className="panel responsive-simulation-control"
        aria-labelledby="demo-simulation-title"
        style={{
          padding: "16px 18px",
          borderRadius: "12px",
          border: "1px solid #dbe6dc",
          background: "white",
        }}
      >
        <div className="simulation-copy">
          <h2 id="demo-simulation-title" style={{ fontSize: "16px" }}>
            Demo Sensor Simulation
          </h2>
          <p style={{ color: "#64748b", fontSize: "13px" }}>
            Generate prototype readings through the production-style ingestion
            pipeline.
          </p>
        </div>
        <div
          className="simulation-scenarios"
          role="group"
          aria-label="Demo scenario"
        >
          {(Object.keys(scenarioLabels) as SimulationScenario[]).map(
            (value) => (
              <button
                key={value}
                type="button"
                aria-pressed={scenario === value}
                disabled={simulationState === "resetting"}
                onClick={() => chooseScenario(value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border:
                    scenario === value
                      ? "1px solid #15803d"
                      : "1px solid #dbe3dc",
                  background: scenario === value ? "#f0fdf4" : "white",
                  color: scenario === value ? "#15803d" : "#475569",
                  fontWeight: scenario === value ? 600 : 500,
                  cursor:
                    simulationState === "resetting" ? "default" : "pointer",
                }}
              >
                {scenarioLabels[value]}
              </button>
            ),
          )}
        </div>
        <div className="simulation-actions">
          <button
            type="button"
            onClick={
              simulationState === "running" ? stopSimulation : startSimulation
            }
            disabled={!selectedFarm?.id || simulationState === "resetting"}
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              border: "none",
              background: simulationState === "running" ? "#b91c1c" : "#15803d",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {simulationState === "running"
              ? "Stop Simulation"
              : "Start Simulation"}
          </button>
          <button
            type="button"
            onClick={() => void resetReadings()}
            disabled={
              !selectedFarm?.id ||
              simulationState === "running" ||
              simulationState === "resetting"
            }
            style={{
              padding: "8px 10px",
              border: "none",
              background: "transparent",
              color: "#64748b",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            {simulationState === "resetting"
              ? "Resetting…"
              : "Reset Demo Readings"}
          </button>
        </div>
        <div
          className="simulation-status"
          role={simulationState === "error" ? "alert" : "status"}
          aria-live="polite"
          style={{ fontSize: "13px", color: "#475569" }}
        >
          {applyingScenario && (
            <strong className="scenario-transition">
              Applying {scenarioLabels[applyingScenario]} scenario…
            </strong>
          )}
          {simulationState === "running" ? (
            <>
              <b style={{ color: "#15803d" }}>
                ● {scenarioLabels[scenario]} • Running
              </b>
              <span>
                {lastReadingAge == null
                  ? "Waiting for first reading"
                  : `Last reading: ${lastReadingAge}s ago`}
              </span>
              <span>Next update: ~{nextUpdateIn ?? 0}s</span>
            </>
          ) : simulationState === "error" ? (
            "Simulation temporarily unavailable"
          ) : simulationState === "resetting" ? (
            "Removing this field’s simulated readings…"
          ) : (
            <>
              <b>Simulation stopped</b>
              <span>
                {lastReadingAge == null
                  ? "No current reading"
                  : `Last reading: ${lastReadingAge}s ago`}
              </span>
            </>
          )}
        </div>
      </section>

      <div
        className="responsive-tabs"
        style={{
          display: "flex",
          gap: "24px",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "8px",
        }}
      >
        {[
          { id: "map", label: "Field Map" },
          { id: "health", label: "Crop Health" },
          { id: "soil", label: "Soil Conditions" },
          { id: "irrigation", label: "Irrigation" },
          { id: "pest", label: "Pest Detection" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 4px",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #16a34a"
                  : "2px solid transparent",
              color: activeTab === tab.id ? "#16a34a" : "#64748b",
              fontWeight: activeTab === tab.id ? 600 : 400,
              background: "none",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message &&
        activeTab === "map" &&
        message !== "No simulated sensor readings available yet" && (
          <div role="status">
            <EmptyState message={message} />
          </div>
        )}

      {
        <>
          {activeTab === "map" && (
            <FieldZoneMap farm={selectedFarm} readings={readings} />
          )}
          {activeTab === "map" && (
            <>
              <div
                className="responsive-grid responsive-grid-four"
                style={{
                  display: "grid",

                  gap: "16px",
                }}
              >
                {[
                  {
                    icon: Activity,
                    label: "Humidity",
                    val: latest ? `${latest.humidity}%` : "—",
                    status: latest
                      ? sensorUnreliable
                        ? "⚠ Unreliable reading"
                        : "Healthy reading"
                      : "Awaiting data",
                    color: sensorUnreliable ? "#7c3aed" : "#16a34a",
                    bg: sensorUnreliable ? "#ede9fe" : "#dcfce7",
                  },
                  {
                    icon: Droplets,
                    label: "Soil Moisture",
                    val: latest ? `${latest.soil_moisture}%` : "—",
                    status: latest
                      ? sensorUnreliable
                        ? "⚠ Unreliable reading"
                        : "Healthy reading"
                      : "Awaiting data",
                    color: sensorUnreliable ? "#7c3aed" : "#3b82f6",
                    bg: sensorUnreliable ? "#ede9fe" : "#dbeafe",
                  },
                  {
                    icon: Thermometer,
                    label: "Temperature",
                    val: latest ? `${latest.temperature}°C` : "—",
                    status: latest
                      ? sensorUnreliable
                        ? "⚠ Unreliable reading"
                        : "Healthy reading"
                      : "Awaiting data",
                    color: sensorUnreliable ? "#7c3aed" : "#f97316",
                    bg: sensorUnreliable ? "#ede9fe" : "#ffedd5",
                  },
                  {
                    icon: Activity,
                    label: "Field Status",
                    val: status.label,
                    status: "Rule-based",
                    color: "#6366f1",
                    bg: "#e0e7ff",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px",
                      background: "white",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: s.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <s.icon size={24} color={s.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: 600 }}>
                        {s.val}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: s.color,
                          fontWeight: 500,
                        }}
                      >
                        {s.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="panel"
                style={{
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  minWidth: 0,
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "16px",
                  }}
                >
                  Stored Sensor History
                </h2>
                <div
                  style={{ height: "260px", minWidth: 0 }}
                  role="img"
                  aria-label="Stored sensor history for selected farm"
                >
                  {readings.length ? (
                    <SensorHistoryChart readings={readings} />
                  ) : (
                    <EmptyState
                      message={
                        message || "No simulated sensor readings available yet"
                      }
                    />
                  )}
                </div>
                <div className="chart-legend">
                  <span>
                    <i style={{ background: "#258c43" }} />
                    Soil Moisture (%)
                  </span>
                  <span>
                    <i style={{ background: "#3488f6" }} />
                    Temperature (°C)
                  </span>
                  <span>
                    <i style={{ background: "#efb50d" }} />
                    Humidity (%)
                  </span>
                </div>
              </div>
              <div
                className="panel"
                style={{
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "16px",
                  }}
                >
                  <Leaf size={20} color="#16a34a" /> Field Insights · Rule-based
                </h2>
                <p>
                  {status.label}: {status.detail}
                </p>
                {latest && (
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                      marginTop: "8px",
                    }}
                  >
                    Sensor quality: {latest.sensor_status}.{" "}
                    {latest.validation_issues
                      .map((issue) => issue.replaceAll("_", " "))
                      .join(" · ")}
                  </p>
                )}
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "13px",
                    marginTop: "8px",
                  }}
                >
                  Zone rules: below 20% Critical; below 30% Stress; below 35%,
                  above 80%, a declining trend, high temperature, low humidity,
                  or a delayed reading Monitor. Prototype indicators, not AI
                  predictions.
                </p>
              </div>
            </>
          )}
          {activeTab === "soil" && (
            <SoilConditions farm={selectedFarm} readings={readings} />
          )}
          {activeTab === "irrigation" && (
            <IrrigationSupport farm={selectedFarm} readings={readings} />
          )}
          {(activeTab === "health" || activeTab === "pest") && (
            <div className="panel" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
                {activeTab === "health" ? "Crop Health" : "Pest Detection"}
              </h2>
              <p style={{ color: "#64748b", fontSize: "13px" }}>
                This prototype module is not connected yet. Crop-health and pest
                models are outside the current implementation step.
              </p>
            </div>
          )}
        </>
      }
    </div>
  );
}
