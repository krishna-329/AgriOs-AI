"use client";
import { useState } from "react";
import { Leaf, SlidersHorizontal } from "lucide-react";
import { useDashboard } from "@/components/dashboard-provider";
import {
  CropRecommendationCard,
  EmptyState,
  ResourceAllocationCard,
} from "@/components/cards";
import { PageHeading } from "@/components/page-heading";
export default function Planner() {
  const { data, error } = useDashboard();
  const [selected, setSelected] = useState("maize");
  const [plan, setPlan] = useState({
    area: 4,
    water: 10000,
    budget: 160000,
    season: "Kharif",
  });
  const [updated, setUpdated] = useState(false);
  if (!data) return <EmptyState message={error || "Loading crop examples…"} />;
  const crop = data.crops.find((c) => c.id === selected)!;
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setPlan({
      area: Number(f.get("area")),
      water: Number(f.get("water")),
      budget: Number(f.get("budget")),
      season: String(f.get("season")),
    });
    setUpdated(true);
  }
  return (
    <>
      <PageHeading
        eyebrow="PLAN WITH PURPOSE"
        title="Make room for a better season."
        description="Explore example crops and see how your resources could be allocated."
      />
      <section className="panel">
        <div className="section-heading">
          <h2>
            <SlidersHorizontal size={20} />
            Your farm inputs
          </h2>
          <span className="pill neutral">Example inputs</span>
        </div>
        <form onSubmit={submit}>
          <div className="planner-form">
            {[
              ["area", "Farm area (ha)", 4],
              ["water", "Available water (m³)", 10000],
              ["budget", "Budget (₹)", 160000],
              ["n", "Nitrogen (kg/ha)", 80],
              ["p", "Phosphorus (kg/ha)", 40],
              ["k", "Potassium (kg/ha)", 40],
              ["ph", "Soil pH", 6.5],
            ].map(([name, label, value]) => (
              <label key={name}>
                {label}
                <input
                  name={String(name)}
                  type="number"
                  defaultValue={value}
                  required
                  min={name === "area" ? 0.01 : 0}
                  max={name === "ph" ? 14 : 10000000}
                  step="0.01"
                />
              </label>
            ))}
            <label>
              Season
              <select name="season">
                <option>Kharif</option>
                <option>Rabi</option>
                <option>Zaid</option>
              </select>
            </label>
          </div>
          <div className="form-bottom">
            <p>
              Soil and season are collected for future models. This preview only
              scales fixed crop examples by area.
            </p>
            <button className="button" type="submit">
              Update preview <Leaf size={16} />
            </button>
          </div>
        </form>
      </section>
      {updated && (
        <p className="inline-feedback" role="status">
          Preview updated for {plan.area} ha · {plan.season}. These are
          illustrative estimates, not model predictions.
        </p>
      )}
      <div className="section-heading standalone">
        <div>
          <h2>Crops to explore</h2>
          <p>Mock recommendations · No calibrated suitability scores</p>
        </div>
      </div>
      <div className="three-column">
        {data.crops.map((c) => (
          <CropRecommendationCard
            key={c.id}
            crop={c}
            area={plan.area}
            selected={selected === c.id}
            onSelect={() => setSelected(c.id)}
          />
        ))}
      </div>
      <section className="panel allocation">
        <div className="section-heading">
          <div>
            <h2>{crop.name} · allocation preview</h2>
            <p>
              A single-crop illustration, not an optimized cultivation plan.
            </p>
          </div>
          <span className="pill neutral">{plan.area} ha allocated</span>
        </div>
        <div className="two-column">
          <div>
            <ResourceAllocationCard
              resource={{
                id: "water",
                name: "Water required",
                used: crop.waterM3Ha * plan.area,
                available: plan.water,
                unit: "m³",
              }}
            />
            <ResourceAllocationCard
              resource={{
                id: "cost",
                name: "Cultivation cost",
                used: crop.costInrHa * plan.area,
                available: plan.budget,
                unit: "INR",
              }}
            />
          </div>
          <div className="allocation-result">
            <span>Illustrative total profit</span>
            <strong>
              ₹{(crop.profitInrHa * plan.area).toLocaleString("en-IN")}
            </strong>
            <small>
              Fixed mock economics · Before local price and yield validation
            </small>
          </div>
        </div>
      </section>
    </>
  );
}
