"use client";
import { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Activity,
  PieChart,
  BarChart2,
} from "lucide-react";
import { EmptyState } from "@/components/cards";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("yield");

  return (
    <div
      className="page-container responsive-page responsive-expert"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Analytics</h1>
        <p style={{ color: "#64748b" }}>Turn data into actionable insights.</p>
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
          { id: "yield", label: "Yield Analysis" },
          { id: "profit", label: "Profitability" },
          { id: "resource", label: "Resource Usage" },
          { id: "trends", label: "Trends & Forecasts" },
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

      {activeTab === "yield" && (
        <>
          <div
            className="responsive-grid responsive-grid-four"
            style={{ display: "grid", gap: "16px" }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <label
                style={{ fontSize: "12px", fontWeight: 500, color: "#64748b" }}
              >
                Season
              </label>
              <select
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <option>Kharif 2025</option>
              </select>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <label
                style={{ fontSize: "12px", fontWeight: 500, color: "#64748b" }}
              >
                Crop
              </label>
              <select
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <option>All Crops</option>
              </select>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <label
                style={{ fontSize: "12px", fontWeight: 500, color: "#64748b" }}
              >
                Field
              </label>
              <select
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <option>All Fields</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                style={{
                  background: "#16a34a",
                  color: "white",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 500,
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                Generate Report
              </button>
            </div>
          </div>

          <div
            className="responsive-grid responsive-grid-four"
            style={{ display: "grid", gap: "16px" }}
          >
            {[
              {
                icon: TrendingUp,
                title: "Total Yield",
                val: "326 tons",
                delta: "+12% vs last season",
                color: "#16a34a",
                bg: "#dcfce7",
              },
              {
                icon: DollarSign,
                title: "Total Revenue",
                val: "₹12.6 lakh",
                delta: "+18% vs last season",
                color: "#eab308",
                bg: "#fef08a",
              },
              {
                icon: BarChart2,
                title: "Profit Margin",
                val: "28%",
                delta: "+3% vs last season",
                color: "#16a34a",
                bg: "#dcfce7",
              },
              {
                icon: Activity,
                title: "Resource Efficiency",
                val: "76%",
                delta: "+8% vs last season",
                color: "#eab308",
                bg: "#fef08a",
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
                    {s.title}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 600 }}>
                    {s.val}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#16a34a",
                      fontWeight: 500,
                    }}
                  >
                    {s.delta}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="responsive-split"
            style={{ display: "grid", gap: "24px" }}
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
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  margin: "0 0 24px 0",
                }}
              >
                Yield Comparison
              </h2>

              <div
                className="responsive-chart-legend"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "16px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: "#16a34a",
                    }}
                  ></div>{" "}
                  This Season
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: "#86efac",
                    }}
                  ></div>{" "}
                  Last Season
                </div>
              </div>

              <div
                style={{ height: "240px", width: "100%", position: "relative" }}
              >
                {/* Fake Bar Chart */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "0",
                    left: "40px",
                    right: "0",
                    height: "100%",
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "flex-end",
                    paddingBottom: "30px",
                  }}
                >
                  {[
                    { name: "Maize", curr: 180, last: 150 },
                    { name: "Red Gram", curr: 60, last: 50 },
                    { name: "Cotton", curr: 100, last: 90 },
                    { name: "Paddy", curr: 140, last: 130 },
                    { name: "Groundnut", curr: 80, last: 70 },
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="responsive-bar-group"
                      style={{
                        display: "flex",
                        gap: "4px",
                        height: "100%",
                        alignItems: "flex-end",
                        position: "relative",
                        width: "40px",
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: `${c.curr}px`,
                          background: "#16a34a",
                          borderRadius: "2px 2px 0 0",
                        }}
                      ></div>
                      <div
                        style={{
                          width: "16px",
                          height: `${c.last}px`,
                          background: "#86efac",
                          borderRadius: "2px 2px 0 0",
                        }}
                      ></div>
                      <div
                        className="responsive-bar-label"
                        style={{
                          position: "absolute",
                          bottom: "-25px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "11px",
                          color: "#64748b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.name}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    top: "0",
                    bottom: "30px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    fontSize: "10px",
                    color: "#94a3b8",
                  }}
                >
                  <span>8</span>
                  <span>6</span>
                  <span>4</span>
                  <span>2</span>
                  <span>0</span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "-20px",
                    top: "100px",
                    transform: "rotate(-90deg)",
                    fontSize: "10px",
                    color: "#94a3b8",
                  }}
                >
                  Yield (tons/acre)
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
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  margin: "0 0 24px 0",
                }}
              >
                Profitability Breakdown
              </h2>

              <div
                className="responsive-donut-layout"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "240px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "160px",
                    height: "160px",
                    borderRadius: "50%",
                    background:
                      "conic-gradient(#16a34a 0% 38%, #f59e0b 38% 62%, #3b82f6 62% 80%, #ef4444 80% 92%, #8b5cf6 92% 100%)",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      background: "white",
                      borderRadius: "50%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "16px" }}>
                      ₹12.6 lakh
                    </div>
                    <div style={{ fontSize: "10px", color: "#64748b" }}>
                      Total Revenue
                    </div>
                  </div>
                </div>

                <div
                  className="responsive-profit-legend"
                  style={{
                    marginTop: "24px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px 24px",
                    fontSize: "11px",
                  }}
                >
                  <div
                    className="responsive-inline-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#16a34a",
                        }}
                      ></div>{" "}
                      Maize
                    </div>{" "}
                    <span>38%</span>
                  </div>
                  <div
                    className="responsive-inline-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#f59e0b",
                        }}
                      ></div>{" "}
                      Red Gram
                    </div>{" "}
                    <span>24%</span>
                  </div>
                  <div
                    className="responsive-inline-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#3b82f6",
                        }}
                      ></div>{" "}
                      Cotton
                    </div>{" "}
                    <span>18%</span>
                  </div>
                  <div
                    className="responsive-inline-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
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
                      Paddy
                    </div>{" "}
                    <span>12%</span>
                  </div>
                  <div
                    className="responsive-inline-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#8b5cf6",
                        }}
                      ></div>{" "}
                      Groundnut
                    </div>{" "}
                    <span>8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
