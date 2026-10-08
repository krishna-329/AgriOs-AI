"use client";
import { useState } from "react";
import {
  Leaf,
  SlidersHorizontal,
  TestTube,
  ThermometerSun,
  Droplets,
  Wind,
  Beaker,
  MapPin,
  Calendar,
  Sprout,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard-provider";
import {
  CropRecommendationCard,
  EmptyState,
  StatusBadge,
} from "@/components/cards";
import { PageHeading } from "@/components/page-heading";

export default function Planner() {
  const { data, error } = useDashboard();
  const [selected, setSelected] = useState("maize");
  const [activeTab, setActiveTab] = useState("recommendation");

  if (!data)
    return <EmptyState message={error || "Loading crop examples..."} />;

  return (
    <div
      className="page-container"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Crop Planner</h1>
        <p style={{ color: "#64748b" }}>Plan smarter. Grow better.</p>
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
          { id: "recommendation", label: "Crop Recommendation" },
          { id: "calendar", label: "Planting Calendar" },
          { id: "soil", label: "Soil Analysis" },
          { id: "yield", label: "Yield Prediction" },
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

      {activeTab === "recommendation" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: "24px",
            }}
          >
            <div
              className="panel"
              style={{
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                background: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <Sprout size={20} color="#16a34a" />
                <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
                  Get Crop Recommendations
                </h2>
              </div>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  marginBottom: "24px",
                }}
              >
                Based on your soil, weather and market data
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <label style={{ fontSize: "14px", fontWeight: 500 }}>
                    Select Field
                  </label>
                  <select
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <option>North Plot (12 acres)</option>
                  </select>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <label style={{ fontSize: "14px", fontWeight: 500 }}>
                    Select Season
                  </label>
                  <select
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <option>Kharif 2025</option>
                  </select>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <label style={{ fontSize: "14px", fontWeight: 500 }}>
                    Soil Type
                  </label>
                  <select
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <option>Loamy Soil</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    style={{
                      background: "#16a34a",
                      color: "white",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      fontWeight: 500,
                      width: "100%",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    Get Recommendations <SlidersHorizontal size={16} />
                  </button>
                </div>
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "24px",
                }}
              >
                <TestTube size={20} color="#16a34a" />
                <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
                  Current Soil Health
                </h2>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "12px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#fef08a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Beaker size={16} color="#ca8a04" />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>
                      pH Level
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600 }}>6.8</div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#16a34a",
                        fontWeight: 500,
                      }}
                    >
                      Good
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "12px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#dcfce7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Leaf size={16} color="#16a34a" />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>
                      Nitrogen (N)
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600 }}>20 kg/ha</div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#eab308",
                        fontWeight: 500,
                      }}
                    >
                      Medium
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "12px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#dcfce7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sprout size={16} color="#16a34a" />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>
                      Phosphorus (P)
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600 }}>18 kg/ha</div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#16a34a",
                        fontWeight: 500,
                      }}
                    >
                      Good
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#fef08a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Leaf size={16} color="#ca8a04" />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>
                      Potassium (K)
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600 }}>125 kg/ha</div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#eab308",
                        fontWeight: 500,
                      }}
                    >
                      Medium
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Leaf size={20} color="#16a34a" /> Recommended Crops for Your
              Region
            </h2>
            <a
              href="#"
              style={{
                color: "#3b82f6",
                fontSize: "14px",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              View all →
            </a>
          </div>

          <div className="three-column">
            {data.crops.map((c) => (
              <div
                key={c.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px",
                  background: "white",
                }}
              >
                <div
                  style={{ display: "flex", gap: "16px", marginBottom: "16px" }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "8px",
                      background: "#f1f5f9",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={
                        c.id === "groundnut"
                          ? "/images/groundnut.svg"
                          : `/images/${c.id}.jpg`
                      }
                      alt={c.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="%23e2e8f0"/></svg>';
                      }}
                    />
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>
                      {c.name}
                    </h3>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          background: "#ecfdf5",
                          color: "#10b981",
                          borderRadius: "4px",
                          border: "1px solid #a7f3d0",
                        }}
                      >
                        High Yield
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          background: "#eff6ff",
                          color: "#3b82f6",
                          borderRadius: "4px",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        Good Market
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    padding: "12px 0",
                    borderTop: "1px solid #f1f5f9",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    Expected Yield
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>
                      {c.yieldTonnesHa} tons/ha
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: c.yieldTonnesHa > 4 ? "#16a34a" : "#eab308",
                        fontWeight: 500,
                      }}
                    >
                      {c.yieldTonnesHa > 4 ? "High" : "Medium"}
                    </div>
                  </div>
                </div>

                <button
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Select Crop
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
