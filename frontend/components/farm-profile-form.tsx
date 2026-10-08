"use client";
import { useState } from "react";
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Lock,
  Link as LinkIcon,
  Plus,
} from "lucide-react";
import { EmptyState } from "@/components/cards";

export function FarmProfilePage({
  initialCreate,
}: {
  initialCreate?: boolean;
}) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div
      className="page-container"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Settings</h1>
        <p style={{ color: "#64748b" }}>
          Manage your account and farm preferences.
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
          { id: "profile", label: "Profile" },
          { id: "farm", label: "Farm Details" },
          { id: "notifications", label: "Notifications" },
          { id: "data", label: "Data & Privacy" },
          { id: "integrations", label: "Integrations" },
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

      {activeTab === "profile" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
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
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                margin: "0 0 24px 0",
              }}
            >
              Profile Information
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: "24px",
                }}
              >
                RK
              </div>
              <button
                style={{
                  padding: "8px 16px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  background: "white",
                  fontWeight: 500,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Change Photo
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#334155",
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="R. Karthikeyan"
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#334155",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="karthikeyan@gmail.com"
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#334155",
                  }}
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  defaultValue="+91 98765 43210"
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#334155",
                  }}
                >
                  Role
                </label>
                <select
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                >
                  <option>Farmer</option>
                  <option>Expert</option>
                </select>
              </div>

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
                  marginTop: "12px",
                }}
              >
                Save Changes
              </button>
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
              Farm Preferences
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#334155",
                  }}
                >
                  Location
                </label>
                <input
                  type="text"
                  defaultValue="Ramanathapuram, Tamil Nadu"
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#334155",
                  }}
                >
                  Units
                </label>
                <select
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                >
                  <option>Metric (Hectares, kg, °C)</option>
                  <option>Imperial (Acres, lbs, °F)</option>
                </select>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#334155",
                  }}
                >
                  Language
                </label>
                <select
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                >
                  <option>English</option>
                  <option>Tamil</option>
                  <option>Hindi</option>
                </select>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#334155",
                  }}
                >
                  Preferred Crops
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      background: "#eff6ff",
                      color: "#3b82f6",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    Maize <span style={{ cursor: "pointer" }}>×</span>
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      background: "#eff6ff",
                      color: "#3b82f6",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    Red Gram <span style={{ cursor: "pointer" }}>×</span>
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      background: "#eff6ff",
                      color: "#3b82f6",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    Cotton <span style={{ cursor: "pointer" }}>×</span>
                  </span>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      background: "#f1f5f9",
                      color: "#64748b",
                      borderRadius: "6px",
                      fontSize: "13px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={14} /> Add Crop
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
