"use client";
import { useWeather } from "@/components/weather-provider";
import Link from "next/link";
import { useState } from "react";
import {
  Leaf,
  Bell,
  CloudSun,
  Sun,
  CloudRain,
  Droplets,
  Wind,
  ChevronRight,
  ArrowRight,
  Warehouse,
  Sprout,
  ChartNoAxesColumnIncreasing,
  Thermometer,
  Bug,
  Layers,
  Coins,
  Activity,
  ShieldCheck,
  Info,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  mockFarmData as farm,
  type OverviewMetric,
  type PriorityAction,
} from "@/data/mockFarmData";
export function SectionHeader({
  title,
  icon: Icon,
  href,
  label = "View details",
  children,
}: {
  title: string;
  icon: LucideIcon;
  href?: string;
  label?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="dash-section-header">
      <h2>
        <Icon size={19} />
        {title}
      </h2>
      {href && (
        <Link href={href}>
          {label}
          <ArrowRight size={12} />
        </Link>
      )}
      {children}
    </div>
  );
}
export function DashboardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`dashboard-card ${className}`}>{children}</section>
  );
}
export function StatusBadge({ level }: { level: string }) {
  return (
    <span className={`ref-badge ${level.toLowerCase().replaceAll(" ", "-")}`}>
      {level}
    </span>
  );
}
export function FarmHealthCard() {
  return (
    <DashboardCard className="health-card">
      <SectionHeader title="Farm Health Score" icon={Leaf} href="/expert" />
      <div className="health-content">
        <div
          className="health-ring"
          role="img"
          aria-label="Mock farm health score 82 out of 100"
        >
          <div>
            <strong>{farm.health.score}</strong>
            <span>/ 100</span>
          </div>
        </div>
        <div className="health-copy">
          <strong>{farm.health.status}</strong>
          <p>{farm.health.description}</p>
          <div className="health-change">
            <ChartNoAxesColumnIncreasing size={30} />
            <span>
              <b>+{farm.health.change}%</b>
              <small>vs. last week</small>
            </span>
          </div>
          <Link className="health-alert" href="/risk-center">
            <Info size={15} />
            <span>{farm.health.alerts} priority alerts require attention.</span>
          </Link>
        </div>
      </div>
      <small className="mock-footnote">
        Illustrative score · Not a validated farm assessment
      </small>
    </DashboardCard>
  );
}
export function PriorityActionItem({
  item,
  onSelect,
}: {
  item: PriorityAction;
  onSelect: () => void;
}) {
  const Icon =
    item.kind === "storage"
      ? Warehouse
      : item.kind === "water"
        ? Droplets
        : Sprout;
  return (
    <button
      className={`priority-item ${item.level.toLowerCase()}`}
      onClick={onSelect}
    >
      <Icon size={25} />
      <span className="priority-text">
        <strong>{item.title}</strong>
        <small>{item.reason}</small>
      </span>
      <StatusBadge level={item.level} />
      <ChevronRight size={15} />
    </button>
  );
}
export function PriorityActions() {
  const [selected, setSelected] = useState<PriorityAction | null>(null);
  return (
    <DashboardCard className="priority-card">
      <SectionHeader
        title="Top Priority Actions"
        icon={Bell}
        href="/risk-center"
        label="View all"
      />
      <div className="priority-items">
        {farm.actions.map((item) => (
          <PriorityActionItem
            key={item.id}
            item={item}
            onSelect={() => setSelected(item)}
          />
        ))}
      </div>
      {selected && (
        <div
          className="action-expanded"
          role="region"
          aria-label="Action details"
        >
          <button
            aria-label="Close action details"
            onClick={() => setSelected(null)}
          >
            <X size={15} />
          </button>
          <strong>{selected.title}</strong>
          <p>
            <b>Why:</b> {selected.why}
          </p>
          <p>
            <b>Action:</b> {selected.action}
          </p>
          <p>
            <b>When:</b> {selected.when}
          </p>
          <small>Mock recommendation · Confirm real conditions first.</small>
        </div>
      )}
    </DashboardCard>
  );
}
export function MetricItem({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  status?: string;
}) {
  return (
    <div className="metric-item">
      <Icon size={14} />
      <span>{label}</span>
      <strong>{value}</strong>
      {status && <small>{status}</small>}
    </div>
  );
}
export function WeatherCard() {
  const { weather, status, retry } = useWeather();
  return (
    <DashboardCard className="weather-card">
      <SectionHeader title="Weather & Environment" icon={CloudSun} />
      {status !== "ready" || !weather ? (
        <div className="weather-state" role={status === "error" ? "alert" : "status"} aria-live="polite">
          <CloudSun size={40} />
          <p>{status === "error" ? "Weather temporarily unavailable" : status === "missing-location" ? "Add farm coordinates to view weather" : "Loading weather…"}</p>
          {status === "error" && <button type="button" onClick={retry}>Try again</button>}
          {status === "missing-location" && <Link href="/farm-profile">Edit farm profile →</Link>}
        </div>
      ) : <>
        <div className="weather-overview">
          <div className="weather-main"><CloudSun size={47} /><div><strong>{Math.round(weather.temperature)}°C</strong><span>{weather.condition}</span></div></div>
          <div className="weather-facts">
            <MetricItem icon={Droplets} label="Humidity" value={`${weather.humidity}%`} />
            <MetricItem icon={CloudRain} label="Rain chance today" value={weather.rain_probability === null ? "Unavailable" : `${weather.rain_probability}%`} />
            <MetricItem icon={Wind} label="Wind" value={`${weather.wind_speed} km/h`} />
          </div>
        </div>
        {weather.forecast.length ? <div className="forecast">
          {weather.forecast.map(day => {
            const date = new Date(`${day.date}T12:00:00Z`);
            const rainy = /rain|drizzle|shower|thunder/i.test(day.condition);
            return <div key={day.date} title={day.condition}>
              <strong>{date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}</strong>
              <small>{date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</small>
              {rainy ? <CloudRain size={19} /> : /clear/i.test(day.condition) ? <Sun size={19} /> : <CloudSun size={19} />}
              <b>{Math.round(day.temperature_max)}°</b><span>{Math.round(day.temperature_min)}°</span>
            </div>;
          })}
        </div> : <p className="weather-source">Forecast unavailable</p>}
        <p className="weather-source">External near-live · <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">{weather.provider}</a> · Model estimate<br />
          <time dateTime={weather.timestamp}>Updated {new Date(weather.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: weather.timezone })}</time> ({weather.timezone})
        </p>
      </>}
    </DashboardCard>
  );
}
export function CropRecommendationItem({
  crop,
}: {
  crop: (typeof farm.crops)[number];
}) {
  return (
    <Link className="crop-recommendation" href="/crop-planner">
      <img src={crop.image} alt={crop.name} width={48} height={48} />
      <div>
        <strong>{crop.name}</strong>
        <div className="crop-tags">
          {crop.tags.map((tag, i) => (
            <span key={tag} className={`tag tag-${i}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="suitability">
        <strong>{crop.suitability}%</strong>
        <small>Mock suitability</small>
      </div>
      <ChevronRight size={13} />
    </Link>
  );
}
export function CropPlannerCard() {
  return (
    <DashboardCard className="crop-summary">
      <SectionHeader
        title="Crop Planner"
        icon={Leaf}
        href="/crop-planner"
        label="View all"
      />
      <p className="card-subtitle">Recommended crops for your region</p>
      {farm.crops.map((c) => (
        <CropRecommendationItem key={c.name} crop={c} />
      ))}
    </DashboardCard>
  );
}
export function ResourceProgress({
  resource,
}: {
  resource: (typeof farm.resources)[number];
}) {
  const Icon =
    resource.kind === "land"
      ? Sprout
      : resource.kind === "water"
        ? Droplets
        : resource.kind === "budget"
          ? Layers
          : Leaf;
  return (
    <div className={`resource-progress ${resource.color}`}>
      <span className="resource-symbol">
        <Icon size={19} />
      </span>
      <div className="resource-label">
        <strong>{resource.name}</strong>
        <small>{resource.value}</small>
      </div>
      <div
        className="resource-track"
        role="progressbar"
        aria-label={resource.name}
        aria-valuenow={resource.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${resource.percent}%` }} />
      </div>
      <b>{resource.percent}%</b>
    </div>
  );
}
export function ResourceAllocationCard() {
  return (
    <DashboardCard className="resource-summary">
      <SectionHeader title="Resource Allocation" icon={Coins}>
        <span className="small-chip">This Season</span>
      </SectionHeader>
      {farm.resources.map((r) => (
        <ResourceProgress key={r.name} resource={r} />
      ))}
    </DashboardCard>
  );
}
export function FieldMonitorChart() {
  const [metric, setMetric] = useState<OverviewMetric>("moisture");
  const [range, setRange] = useState("7");
  const rows = farm.readings
    .slice(-Number(range))
    .map((r) => ({
      day: r.day,
      ...Object.fromEntries(r[metric].map((f) => [f.name, f.value])),
    }));
  const unit = metric === "temperature" ? "°C" : "%";
  return (
    <DashboardCard className="field-summary">
      <SectionHeader title="Live Field Monitor" icon={Activity}>
        <select
          aria-label="Chart time range"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="7">Last 7 Days</option>
          <option value="3">Last 3 Days</option>
        </select>
      </SectionHeader>
      <div className="chart-tabs" role="group" aria-label="Sensor metric">
        {(
          [
            ["moisture", "Soil Moisture"],
            ["temperature", "Temperature"],
            ["humidity", "Humidity"],
          ] as const
        ).map(([value, label]) => (
          <button
            aria-pressed={metric === value}
            key={value}
            onClick={() => setMetric(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="reference-chart"
        role="img"
        aria-label={`${metric} example history for three fields`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={rows}
            margin={{ left: -28, right: 8, top: 12, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#e9eeed"
              strokeDasharray="2 3"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#77818d" }}
            />
            <YAxis
              domain={metric === "temperature" ? [20, 40] : [0, 80]}
              tickFormatter={(v) => `${v}${unit}`}
              tick={{ fontSize: 9, fill: "#77818d" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 8,
                border: "1px solid #e5ebe6",
              }}
              formatter={(v, name) => [`${v}${unit}`, name]}
            />
            {["Field 1", "North Plot", "South Plot"].map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={["#258c43", "#3488f6", "#efb50d"][i]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {["Field 1", "North Plot", "South Plot"].map((name, i) => (
          <span key={name}>
            <i style={{ background: ["#258c43", "#3488f6", "#efb50d"][i] }} />
            {name}
          </span>
        ))}
      </div>
      <small className="mock-footnote">
        Simulated IoT Data · Historical example, not live devices
      </small>
    </DashboardCard>
  );
}
export function GrainGuardCard() {
  const s = farm.storage;
  return (
    <DashboardCard className="grain-summary">
      <SectionHeader title="GrainGuard" icon={Warehouse} href="/grainguard" />
      <div className="grain-content">
        <img
          src="/images/silo-generated.png"
          alt="Grain storage silos"
          width={110}
          height={100}
        />
        <div className="grain-status">
          <strong>Storage Risk Level · {s.scope}</strong>
          <span className="low-risk">
            <ShieldCheck size={18} />
            {s.risk}
          </span>
          <p>{s.description}</p>
        </div>
        <div className="storage-metrics">
          <MetricItem
            icon={Thermometer}
            label="Storage Temperature"
            value={`${s.temperature}°C`}
            status="Optimal"
          />
          <MetricItem
            icon={Droplets}
            label="Grain Moisture"
            value={`${s.moisture}%`}
            status="Optimal"
          />
          <MetricItem
            icon={Wind}
            label="Humidity"
            value={`${s.humidity}%`}
            status="Optimal"
          />
          <MetricItem
            icon={Bug}
            label="Insect Activity"
            value={s.activity}
            status="Mock result"
          />
        </div>
      </div>
      <small className="mock-footnote">
        Bin 1 example · Separate Bin 2 inspection alert remains open
      </small>
    </DashboardCard>
  );
}
export function RiskDistributionCard() {
  return (
    <DashboardCard className="risk-summary">
      <SectionHeader
        title="Risk Distribution Across Modules"
        icon={ChartNoAxesColumnIncreasing}
        href="/expert"
        label="View analysis"
      />
      <div className="risk-content">
        <div className="risk-donut">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={farm.risk.categories}
                dataKey="value"
                innerRadius="65%"
                outerRadius="92%"
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {farm.risk.categories.map((c) => (
                  <Cell key={c.name} fill={c.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div>
            <strong>{farm.risk.overall}%</strong>
            <small>Overall Risk</small>
          </div>
        </div>
        <div className="risk-key">
          {farm.risk.categories.map((c) => (
            <div key={c.name}>
              <i style={{ background: c.color }} />
              <span>{c.name}</span>
              <b>{c.value}%</b>
            </div>
          ))}
        </div>
        <div className="risk-insight">
          <Leaf size={27} />
          <strong>Risk level is low across most modules.</strong>
          <p>Continue monitoring for early detection and better decisions.</p>
        </div>
      </div>
      <small className="mock-footnote">
        Illustrative indicators · Independent values, not an averaged risk score
      </small>
    </DashboardCard>
  );
}
