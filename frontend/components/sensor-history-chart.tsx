"use client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SensorReading } from "@/types/sensor";

export function SensorHistoryChart({
  readings,
  metric,
}: {
  readings: SensorReading[];
  metric?: "soil_moisture" | "temperature" | "humidity";
}) {
  const series = [
    { key: "soil_moisture", label: "Soil Moisture (%)", color: "#258c43" },
    { key: "temperature", label: "Temperature (°C)", color: "#3488f6" },
    { key: "humidity", label: "Humidity (%)", color: "#efb50d" },
  ].filter((s) => !metric || s.key === metric);
  const rows = readings.map((r) => ({ ...r, time: Date.parse(r.recorded_at) }));
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <LineChart
        data={rows}
        margin={{ left: -12, right: 8, top: 12, bottom: 0 }}
      >
        <CartesianGrid
          vertical={false}
          stroke="#e9eeed"
          strokeDasharray="2 3"
        />
        <XAxis
          dataKey="time"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(t) =>
            new Date(t).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          }
          axisLine={false}
          tickLine={false}
          minTickGap={30}
          tick={{ fontSize: 9, fill: "#77818d" }}
        />
        <YAxis
          domain={metric === "temperature" ? ["auto", "auto"] : [0, 100]}
          tick={{ fontSize: 9, fill: "#77818d" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 11,
            borderRadius: 8,
            border: "1px solid #e5ebe6",
          }}
          labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
          formatter={(value, name) => [value, name]}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="linear"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
