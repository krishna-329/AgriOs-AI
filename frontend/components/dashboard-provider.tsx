"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { dashboardRepository } from "@/services/dashboard";
import type { DashboardSnapshot, SensorReading } from "@/types/dashboard";
type Context = {
  data: DashboardSnapshot | null;
  error: string;
  readings: SensorReading[];
  running: boolean;
  setRunning: (v: boolean) => void;
  acknowledged: string[];
  acknowledge: (id: string) => void;
  sampleId: string;
  setSampleId: (id: string) => void;
};
const DashboardContext = createContext<Context | null>(null);
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState("");
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [running, setRunning] = useState(false);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [sampleId, setSampleId] = useState("activity");
  useEffect(() => {
    dashboardRepository
      .load()
      .then((d) => {
        setData(d);
        setReadings(d.readings);
      })
      .catch(() => setError("Could not load demo data. Refresh to try again."));
  }, []);
  useEffect(() => {
    if (!running) return;
    let tick = 0;
    const timer = setInterval(() => {
      tick++;
      setReadings((previous) => {
        const last = previous[previous.length - 1];
        if (!last) return previous;
        const next = {
          ...last,
          time: `Live ${tick}`,
          moisture: +Math.max(19, last.moisture - 0.25).toFixed(1),
          temperature: +Math.min(35, last.temperature + 0.08).toFixed(1),
          humidity: +Math.max(50, last.humidity - 0.1).toFixed(1),
        };
        return [...previous.slice(-23), next];
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [running]);
  return (
    <DashboardContext.Provider
      value={{
        data,
        error,
        readings,
        running,
        setRunning,
        acknowledged,
        acknowledge: (id) =>
          setAcknowledged((previous) =>
            previous.includes(id)
              ? previous.filter((x) => x !== id)
              : [...previous, id],
          ),
        sampleId,
        setSampleId,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
export function useDashboard() {
  const value = useContext(DashboardContext);
  if (!value) throw new Error("DashboardProvider missing");
  return value;
}
