"use client";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  Clock3,
  Droplets,
  Leaf,
  Sprout,
} from "lucide-react";
import type {
  CropRecommendation,
  ResourceBudget,
  RiskEvent,
  Tone,
} from "@/types/dashboard";
import type { LucideIcon } from "lucide-react";
export function StatusBadge({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <span className={`pill ${tone}`}>
      <span className="dot" />
      {children}
    </span>
  );
}
export function StatCard({
  title,
  value,
  detail,
  icon: Icon = Leaf,
  tone = "normal",
}: {
  title: string;
  value: string;
  detail: string;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className={`icon-box ${tone}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <p>{detail}</p>
    </article>
  );
}
export function SensorCard(props: Parameters<typeof StatCard>[0]) {
  return <StatCard {...props} />;
}
export function RiskCard({
  risk,
  acknowledged = false,
  onAcknowledge,
}: {
  risk: RiskEvent;
  acknowledged?: boolean;
  onAcknowledge?: (id: string) => void;
}) {
  return (
    <article className={`risk-card ${risk.severity}`}>
      <div className="card-heading">
        <StatusBadge tone={risk.severity}>
          {risk.severity === "urgent"
            ? "Urgent"
            : risk.severity === "warning"
              ? "Action soon"
              : "Routine"}
        </StatusBadge>
        <span className="muted">
          {risk.module} · Priority {risk.priority}
        </span>
      </div>
      <h3>{risk.what}</h3>
      <dl className="risk-details">
        <div>
          <dt>Why?</dt>
          <dd>{risk.why}</dd>
        </div>
        <div>
          <dt>What should I do?</dt>
          <dd>{risk.action}</dd>
        </div>
        <div>
          <dt>When?</dt>
          <dd>
            <Clock3 size={14} />
            {risk.when}
          </dd>
        </div>
      </dl>
      <div className="card-bottom">
        <small>{risk.source}</small>
        {onAcknowledge && (
          <button
            className="text-button"
            onClick={() => onAcknowledge(risk.id)}
          >
            {acknowledged ? (
              <>
                <Check size={15} />
                Acknowledged · undo
              </>
            ) : (
              "Acknowledge →"
            )}
          </button>
        )}
      </div>
    </article>
  );
}
export function RecommendationCard({
  risk,
  index,
}: {
  risk: RiskEvent;
  index: number;
}) {
  return (
    <div className="recommendation">
      <span className={`step ${risk.severity}`}>{index}</span>
      <div>
        <strong>{risk.action}</strong>
        <p>{risk.when}</p>
      </div>
      <ArrowUpRight size={18} />
    </div>
  );
}
export function CropRecommendationCard({
  crop,
  selected,
  onSelect,
  area,
}: {
  crop: CropRecommendation;
  selected: boolean;
  onSelect: () => void;
  area: number;
}) {
  return (
    <article className={`crop-card ${selected ? "selected" : ""}`}>
      <div className="card-heading">
        <span className="crop-icon">
          <Sprout size={27} />
        </span>
        <span className="pill neutral">{crop.suitability}</span>
      </div>
      <h3>{crop.name}</h3>
      <p>{crop.variety}</p>
      <div className="crop-metrics">
        <div>
          <small>Example yield</small>
          <strong>{(crop.yieldTonnesHa * area).toFixed(1)} t</strong>
        </div>
        <div>
          <small>Example profit</small>
          <strong>
            ₹{Math.round(crop.profitInrHa * area).toLocaleString("en-IN")}
          </strong>
        </div>
      </div>
      <p>{crop.reason}</p>
      <button
        className={selected ? "button" : "button outline"}
        onClick={onSelect}
      >
        {selected ? (
          <>
            <Check size={16} /> Selected for preview
          </>
        ) : (
          "Preview allocation"
        )}
      </button>
    </article>
  );
}
export function ResourceAllocationCard({
  resource,
}: {
  resource: ResourceBudget;
}) {
  const percent =
    resource.available > 0
      ? Math.min(100, (resource.used / resource.available) * 100)
      : 0;
  const over = resource.used > resource.available;
  return (
    <div className="resource">
      <div>
        <span>{resource.name}</span>
        <strong>
          {resource.used.toLocaleString("en-IN")}{" "}
          <small>
            / {resource.available.toLocaleString("en-IN")} {resource.unit}
          </small>
        </strong>
      </div>
      <div
        className={`meter ${over ? "over" : ""}`}
        role="progressbar"
        aria-label={resource.name}
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      {over && <small className="error">Exceeds available resources</small>}
    </div>
  );
}
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <CircleAlert size={25} />
      <p>{message}</p>
    </div>
  );
}
