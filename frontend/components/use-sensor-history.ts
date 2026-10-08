"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFarm } from "@/components/farm-provider";
import { getSensorHistory } from "@/services/sensors";
import type { SensorReading } from "@/types/sensor";

type State = {
  farmId?: string;
  fieldId?: string;
  readings: SensorReading[];
  status: "loading" | "ready" | "error";
};
export function useSensorHistory(fieldId = "field-1") {
  const { selectedFarm, status: farmStatus } = useFarm();
  const farmId = selectedFarm?.id;
  const [state, setState] = useState<State>({
    readings: [],
    status: "loading",
  });
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const refresh = useCallback(() => refreshRef.current(), []);
  useEffect(() => {
    if (farmStatus !== "ready" || !farmId) {
      refreshRef.current = async () => {};
      return;
    }
    let active = true;
    let fetching = false;
    let pending = false;
    let controller: AbortController | undefined;
    setState({ farmId, fieldId, readings: [], status: "loading" });
    async function refresh() {
      if (fetching) {
        pending = true;
        return;
      }
      fetching = true;
      do {
        pending = false;
        const request = new AbortController();
        controller = request;
        const timeout = setTimeout(() => request.abort(), 10000);
        try {
          const readings = await getSensorHistory(
            farmId!,
            fieldId,
            request.signal,
          );
          if (active) setState({ farmId, fieldId, readings, status: "ready" });
        } catch {
          if (active)
            setState({ farmId, fieldId, readings: [], status: "error" });
        } finally {
          clearTimeout(timeout);
        }
      } while (active && pending);
      fetching = false;
    }
    refreshRef.current = refresh;
    void refresh();
    const interval = setInterval(() => void refresh(), 5000);
    return () => {
      active = false;
      refreshRef.current = async () => {};
      controller?.abort();
      clearInterval(interval);
    };
  }, [farmId, farmStatus, fieldId]);
  // Hide previous-farm data in the same render as a selection change, before effects run.
  const current =
    farmStatus === "ready" &&
    state.farmId === farmId &&
    state.fieldId === fieldId;
  const readings = current && state.status === "ready" ? state.readings : [];
  const message =
    farmStatus === "loading"
      ? "Loading farms..."
      : farmStatus === "error"
        ? "Farm data temporarily unavailable"
        : !farmId
          ? "Select a farm to view sensor readings"
          : !current || state.status === "loading"
            ? "Loading sensor readings..."
            : state.status === "error"
              ? "Sensor readings temporarily unavailable"
              : !readings.length
                ? "No simulated sensor readings available yet"
                : null;
  return { readings, latest: readings.at(-1), message, selectedFarm, refresh };
}
