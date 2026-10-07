"use client";
import { useState } from "react";
import { useDashboard } from "@/components/dashboard-provider";
import { EmptyState, RiskCard, StatCard } from "@/components/cards";
import { PageHeading } from "@/components/page-heading";
import { ShieldAlert, Clock3, CircleCheck } from "lucide-react";
export default function Risks() {
  const { data, error, acknowledged, acknowledge } = useDashboard();
  const [filter, setFilter] = useState("All");
  if (!data) return <EmptyState message={error || "Loading example risks…"} />;
  const risks = data.risks
    .filter(
      (r) =>
        filter === "All" ||
        (filter === "Urgent" && r.severity === "urgent") ||
        (filter === "Medium" && r.severity === "warning") ||
        (filter === "Low" && r.severity === "normal"),
    )
    .sort((a, b) => a.priority - b.priority);
  return (
    <>
      <PageHeading
        eyebrow="THE RIGHT ACTION, AT THE RIGHT TIME"
        title="Let’s focus on what matters."
        description="Example risks across your farm, ordered by a fixed demo priority."
      />
      <div className="three-column">
        <StatCard
          title="Urgent"
          value="1"
          detail="Storage inspection"
          tone="urgent"
          icon={ShieldAlert}
        />
        <StatCard
          title="Medium priority"
          value="1"
          detail="Field moisture check"
          tone="warning"
          icon={Clock3}
        />
        <StatCard
          title="Low priority"
          value="1"
          detail="Routine crop observation"
          icon={CircleCheck}
        />
      </div>
      <div className="risk-toolbar">
        <div className="segmented" role="group" aria-label="Filter risks">
          {["All", "Urgent", "Medium", "Low"].map((item) => (
            <button
              key={item}
              aria-pressed={filter === item}
              className={filter === item ? "selected" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="muted">
          {acknowledged.length} acknowledged this session
        </span>
      </div>
      <div className="risk-list">
        {risks.map((r) => (
          <RiskCard
            key={r.id}
            risk={r}
            acknowledged={acknowledged.includes(r.id)}
            onAcknowledge={acknowledge}
          />
        ))}
      </div>
      <p className="source-label">
        Acknowledgment marks an alert as seen; it does not resolve the
        underlying risk. Demo ordering is not a validated risk score.
      </p>
    </>
  );
}
