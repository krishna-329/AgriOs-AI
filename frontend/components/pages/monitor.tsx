"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Droplets, Thermometer, Activity, Leaf } from "lucide-react";
import { useSensorHistory } from "@/components/use-sensor-history";
import { SensorHistoryChart } from "@/components/sensor-history-chart";
import { SoilConditions } from "@/components/field-monitor/soil-conditions";
import { IrrigationSupport } from "@/components/field-monitor/irrigation-support";
import {
  fieldStatus,
  resetDemoReadings,
  simulateSensorTick,
  type SimulationScenario,
} from "@/services/sensors";
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);
  const tickInFlightRef = useRef(false);
  const fieldId = "field-1";
  const status = fieldStatus(readings);

  const stopSimulation = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setSimulationState("stopped");
  }, []);

  const generateTick = useCallback(async () => {
    if (!selectedFarm?.id || tickInFlightRef.current) return;
    tickInFlightRef.current = true;
    try {
      const reading = await simulateSensorTick(
        selectedFarm.id,
        fieldId,
        scenario,
      );
      if (runningRef.current) {
        setLastTick(reading);
        await refresh();
      }
    } catch {
      runningRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setSimulationState("error");
    } finally {
      tickInFlightRef.current = false;
    }
  }, [refresh, scenario, selectedFarm?.id]);

  const startSimulation = useCallback(() => {
    if (!selectedFarm?.id || runningRef.current) return;
    runningRef.current = true;
    setLastTick(null);
    setSimulationState("running");
    void generateTick();
    timerRef.current = setInterval(() => void generateTick(), 5000);
  }, [generateTick, selectedFarm?.id]);

  const resetReadings = useCallback(async () => {
    if (!selectedFarm?.id) return;
    stopSimulation();
    setSimulationState("resetting");
    try {
      await resetDemoReadings(selectedFarm.id, fieldId);
      setLastTick(null);
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
    return stopSimulation;
  }, [selectedFarm?.id, stopSimulation]);

  const scenarioLabels: Record<SimulationScenario, string> = {
    normal: "Normal",
    water_stress: "Water Stress",
    sensor_failure: "Sensor Failure",
  };
  return (
    <div
      className="page-container responsive-page responsive-monitor"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Field Monitor</h1>
        <p style={{ color: "#64748b" }}>
          {latest
            ? `${latest.source === "simulator" ? "Simulated IoT Data" : "Sensor data"} · Source: ${latest.source} · Recorded ${new Date(latest.recorded_at).toLocaleString()}`
            : "Prototype sensor stream"}
        </p>
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
            Simulated IoT Data · Prototype stream — no physical sensor connected
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
                disabled={simulationState === "running"}
                onClick={() => setScenario(value)}
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
                  cursor: simulationState === "running" ? "default" : "pointer",
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
          {simulationState === "running" ? (
            <>
              <b style={{ color: "#15803d" }}>● Simulation running</b>
              <span>{scenarioLabels[scenario]}</span>
              <span>
                {lastTick
                  ? `Last reading: ${Math.max(0, Math.round((Date.now() - Date.parse(lastTick.recorded_at)) / 1000))} seconds ago`
                  : "Generating first reading…"}
              </span>
            </>
          ) : simulationState === "error" ? (
            "Simulation temporarily unavailable"
          ) : simulationState === "resetting" ? (
            "Removing this field’s simulated readings…"
          ) : (
            "Simulation stopped"
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

      {message && activeTab === "map" && (
        <div role="status">
          <EmptyState message={message} />
          {message === "No simulated sensor readings available yet" && (
            <p style={{ color: "#64748b", fontSize: "13px" }}>
              Start the sensor simulator to generate prototype readings.
            </p>
          )}
        </div>
      )}

      {
        <>
          {activeTab === "map" && (
            <div
              className="responsive-field-map"
              style={{
                position: "relative",
                height: "400px",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                background: "#e2e8f0",
              }}
            >
              <img
                src="/images/farm-landscape.png"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.8,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gridTemplateRows: "repeat(3, 1fr)",
                    width: "80%",
                    height: "80%",
                    gap: "4px",
                  }}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        background:
                          i === 5
                            ? "rgba(239,68,68,0.5)"
                            : i === 6
                              ? "rgba(234,179,8,0.5)"
                              : "rgba(34,197,94,0.4)",
                        border: "1px solid rgba(255,255,255,0.5)",
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              <div
                className="responsive-map-legend"
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "white",
                  padding: "12px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  Crop Health · Demo overlay
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#22c55e",
                      }}
                    ></div>{" "}
                    Healthy
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#eab308",
                      }}
                    ></div>{" "}
                    Moderate
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#f97316",
                      }}
                    ></div>{" "}
                    Stress
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#ef4444",
                      }}
                    ></div>{" "}
                    Critical
                  </div>
                </div>
              </div>
              <div
                className="responsive-map-caption"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "#1e293b",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {selectedFarm?.name || "Selected farm"}
                <br />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#94a3b8",
                  }}
                >
                  {selectedFarm?.area_acres ?? "—"} acres · Demo overlay
                </span>
              </div>
            </div>
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
                    status: latest ? latest.sensor_status : "Unavailable",
                    color: "#16a34a",
                    bg: "#dcfce7",
                  },
                  {
                    icon: Droplets,
                    label: "Soil Moisture",
                    val: latest ? `${latest.soil_moisture}%` : "—",
                    status: latest ? latest.sensor_status : "Unavailable",
                    color: "#3b82f6",
                    bg: "#dbeafe",
                  },
                  {
                    icon: Thermometer,
                    label: "Temperature",
                    val: latest ? `${latest.temperature}°C` : "—",
                    status: latest ? latest.sensor_status : "Unavailable",
                    color: "#f97316",
                    bg: "#ffedd5",
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
                  Sensor History ·{" "}
                  {latest?.source === "simulator"
                    ? "Simulated IoT Data"
                    : "Source: " + (latest?.source || "unavailable")}
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
                    {latest.validation_issues.join(" · ")}
                  </p>
                )}
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "13px",
                    marginTop: "8px",
                  }}
                >
                  Basic moisture rules: below 20% Critical; below 30% or a drop
                  of 6 points across recent readings Monitor. Prototype
                  indicators, not AI predictions.
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
