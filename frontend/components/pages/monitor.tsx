"use client";
import { useEffect, useState } from "react";
import {
  Droplets,
  Thermometer,
  Wind,
  CloudRain,
  Clock,
  Map,
  Activity,
  TestTube,
  ArrowRight,
  Leaf,
} from "lucide-react";
import { useFarm } from "@/components/farm-provider";
import { EmptyState } from "@/components/cards";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

type SensorReading = {
  id: string;
  farm_id: string;
  field_id: string;
  soil_moisture: number;
  temperature: number;
  humidity: number;
  source: string;
  recorded_at: string;
};
export default function Monitor() {
  const { selectedFarm, status: farmStatus } = useFarm();
  const farmId = selectedFarm?.id;
  const [state, setState] = useState<{
    farmId?: string;
    readings: SensorReading[];
    status: "loading" | "ready" | "error";
  }>({ readings: [], status: "loading" });
  const [activeTab, setActiveTab] = useState("map");
  useEffect(() => {
    if (farmStatus !== "ready" || !farmId) return;
    let active = true;
    let fetching = false;
    let controller: AbortController | null = null;
    setState({ farmId, readings: [], status: "loading" });
    const fetchHistory = async () => {
      if (fetching) return;
      fetching = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 10000);
      try {
        const params = new URLSearchParams({
          farm_id: farmId,
          field_id: "field-1",
          limit: "1",
        });
        const res = await fetch(`${API_BASE}/api/sensors/history?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Sensor request failed");
        const data: SensorReading[] = await res.json();
        if (
          !Array.isArray(data) ||
          data.some(
            (reading) =>
              reading.farm_id !== farmId ||
              !Number.isFinite(reading.soil_moisture) ||
              !Number.isFinite(reading.temperature) ||
              !Number.isFinite(reading.humidity),
          )
        )
          throw new Error("Invalid sensor response");
        if (active) setState({ farmId, readings: data, status: "ready" });
      } catch {
        if (active) setState({ farmId, readings: [], status: "error" });
      } finally {
        clearTimeout(timeout);
        fetching = false;
      }
    };
    void fetchHistory();
    const interval = setInterval(() => void fetchHistory(), 5000);
    return () => {
      active = false;
      clearInterval(interval);
      controller?.abort();
    };
  }, [farmId, farmStatus]);
  if (farmStatus === "loading")
    return <EmptyState message="Loading farms..." />;
  if (farmStatus === "error")
    return <EmptyState message="Farm data temporarily unavailable" />;
  if (!farmId)
    return <EmptyState message="Select a farm to view sensor readings" />;
  if (state.farmId !== farmId || state.status === "loading")
    return <EmptyState message="Loading sensor readings..." />;
  if (state.status === "error")
    return <EmptyState message="Sensor readings temporarily unavailable" />;
  if (!state.readings.length)
    return <EmptyState message="No simulated sensor readings available yet" />;
  const latest = state.readings[0];
  return (
    <div
      className="page-container"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Field Monitor</h1>
        <p style={{ color: "#64748b" }}>
          Simulated sensor data · Source: {latest.source} · Recorded{" "}
          {new Date(latest.recorded_at).toLocaleString()}
        </p>
      </div>

      <div
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

      {activeTab === "map" && (
        <>
          <div
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
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
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
              North Plot
              <br />
              <span
                style={{ fontSize: "12px", fontWeight: 400, color: "#94a3b8" }}
              >
                12 acres
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}
          >
            {[
              {
                icon: Activity,
                label: "NDVI (Demo)",
                val: "0.78",
                status: "Demo",
                color: "#16a34a",
                bg: "#dcfce7",
              },
              {
                icon: Droplets,
                label: "Soil Moisture",
                val: `${latest.soil_moisture}%`,
                status: "Simulated",
                color: "#3b82f6",
                bg: "#dbeafe",
              },
              {
                icon: Thermometer,
                label: "Temperature",
                val: `${latest.temperature}°C`,
                status: "Simulated",
                color: "#f97316",
                bg: "#ffedd5",
              },
              {
                icon: CloudRain,
                label: "Rainfall (Demo)",
                val: "12 mm",
                status: "Demo",
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
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <Leaf size={20} color="#16a34a" /> Field Insights · Demo examples
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  border: "1px solid #fef08a",
                  background: "#fefce8",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{ display: "flex", gap: "16px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "40px",
                      background: "#eab308",
                      borderRadius: "4px",
                    }}
                  ></div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "14px" }}>
                      Mild crop stress detected in South Plot
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                      NDVI has dropped by 12% in the last 3 days.
                    </div>
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    14 Apr 2025
                  </span>
                  <ArrowRight size={16} color="#94a3b8" />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{ display: "flex", gap: "16px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "40px",
                      background: "#22c55e",
                      borderRadius: "4px",
                    }}
                  ></div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "14px" }}>
                      Good growth observed in North Plot
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                      Vegetation index improved by 8% compared to last week.
                    </div>
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    14 Apr 2025
                  </span>
                  <ArrowRight size={16} color="#94a3b8" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
