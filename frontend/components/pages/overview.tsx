"use client";
import { useFarm } from "@/components/farm-provider";
import { useState } from "react";
import {
  Sprout,
  Leaf,
  ChartNoAxesColumnIncreasing,
  ShieldCheck,
  Users,
} from "lucide-react";
import { mockFarmData, type DashboardPeriod } from "@/data/mockFarmData";
import {
  FarmHealthCard,
  PriorityActions,
  WeatherCard,
  CropPlannerCard,
  ResourceAllocationCard,
  FieldMonitorChart,
  GrainGuardCard,
  RiskDistributionCard,
} from "@/components/overview/dashboard-cards";
export function PageHeader() {
  const { selectedFarm, status } = useFarm();
  return (
    <div className="reference-page-header">
      <div>
        <h1>Farm Overview</h1>
        <p>
          {selectedFarm ? [selectedFarm.name, selectedFarm.area_acres != null ? `${Number(selectedFarm.area_acres.toFixed(2))} acres` : null, selectedFarm.current_crop].filter(Boolean).join(" · ") : status === "loading" ? "Loading farm…" : "Set up or select your farm to get started."}
        </p>
      </div>
      <div className="landscape-message">
        Good Land
        <br />
        <span>Greater Possibilities</span>
      </div>
      <div className="header-note">
        <span>Sample · 14 Apr 2025</span>
        <p>
          <Sprout size={27} />
          Growing smarter
          <br />
          tomorrow, together.
        </p>
      </div>
    </div>
  );
}
export default function Overview() {
  const [period, setPeriod] = useState<DashboardPeriod>("Today");
  return (
    <div className="reference-overview">
      <PageHeader />
      <div
        className="overview-periods"
        role="group"
        aria-label="Overview period"
      >
        {(["Today", "This Week", "This Season"] as const).map((p) => (
          <button
            key={p}
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="reference-source">
        <span>{mockFarmData.periods[period]}</span>
        <span>External near-live weather · Other cards are demo</span>
      </div>
      <div className="reference-grid">
        <FarmHealthCard />
        <PriorityActions />
        <WeatherCard />
        <CropPlannerCard />
        <ResourceAllocationCard />
        <FieldMonitorChart />
        <GrainGuardCard />
        <RiskDistributionCard />
      </div>
      <div className="value-strip">
        {[
          [
            Leaf,
            "Data-Driven Farming",
            "Turn real-time data into better decisions.",
          ],
          [
            ChartNoAxesColumnIncreasing,
            "Higher Yields",
            "Optimize resources. Grow more.",
          ],
          [
            ShieldCheck,
            "Resilient Farms",
            "Stay ahead of risks and uncertainties.",
          ],
          [
            Users,
            "Sustainable Tomorrow",
            "Healthy farms for future generations.",
          ],
        ].map(([Icon, title, text]) => {
          const I = Icon as typeof Leaf;
          return (
            <div key={String(title)}>
              <I size={23} />
              <span>
                <strong>{String(title)}</strong>
                <small>{String(text)}</small>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
