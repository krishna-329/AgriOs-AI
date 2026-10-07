"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SensorReading } from "@/types/dashboard";
export function ChartCard({
  title,
  description,
  data,
  metric = "moisture",
  unit = "%",
  color = "#427653",
}: {
  title: string;
  description: string;
  data: SensorReading[];
  metric?: "moisture" | "temperature" | "humidity" | "rainfall";
  unit?: string;
  color?: string;
}) {
  return (
    <section className="panel chart-card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="chart-unit">{unit}</span>
      </div>
      <div
        className="chart"
        role="img"
        aria-label={`${title}. ${data.length} simulated readings; latest ${data.at(-1)?.[metric]} ${unit}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 5"
              vertical={false}
              stroke="#e5e9e2"
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "#798579" }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#798579" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #dfe5db",
                fontSize: 12,
              }}
              formatter={(value) => [`${value} ${unit}`, title]}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#fill-${metric})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <small className="source-label">
        Simulated IoT Data · Illustrative trends
      </small>
    </section>
  );
}
