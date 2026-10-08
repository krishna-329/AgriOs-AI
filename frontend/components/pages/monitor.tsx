"use client";
import { useState } from "react";
import { Droplets, Thermometer, Activity, Leaf } from "lucide-react";
import { useSensorHistory } from "@/components/use-sensor-history";
import { SensorHistoryChart } from "@/components/sensor-history-chart";
import { fieldStatus } from "@/services/sensors";
import { EmptyState } from "@/components/cards";

export default function Monitor() {
  const { readings, latest, message, selectedFarm } = useSensorHistory();
  const [activeTab, setActiveTab] = useState("map");
  const status = fieldStatus(readings);
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

      {message && (
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
          {activeTab !== "map" && (
            <p style={{ color: "#64748b", fontSize: "13px" }}>
              This tab currently shows prototype sensor context only. Crop
              health and pest prediction models are not connected.
            </p>
          )}
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
                style={{ color: "#64748b", fontSize: "13px", marginTop: "8px" }}
              >
                Sensor quality: {latest.sensor_status}.{" "}
                {latest.validation_issues.join(" · ")}
              </p>
            )}
            <p style={{ color: "#64748b", fontSize: "13px", marginTop: "8px" }}>
              Basic moisture rules: below 20% Critical; below 30% or a drop of 6
              points across recent readings Monitor. Prototype indicators, not
              AI predictions.
            </p>
          </div>
        </>
      }
    </div>
  );
}
