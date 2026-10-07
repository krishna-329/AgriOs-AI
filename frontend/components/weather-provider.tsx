"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { WeatherResponse } from "@/types/weather";
import { getWeather } from "@/services/weather";
import { useFarm } from "@/components/farm-provider";
type WeatherState = { weather: WeatherResponse | null; status: "loading" | "ready" | "error" | "missing-location"; retry: () => void };
const Context = createContext<WeatherState | null>(null);
export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const { selectedFarm, status: farmStatus, reloadFarms } = useFarm();
  const id = selectedFarm?.id;
  const latitude = selectedFarm?.latitude;
  const longitude = selectedFarm?.longitude;
  const key = `${farmStatus}:${id}:${latitude}:${longitude}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; weather: WeatherResponse | null; status: WeatherState["status"] }>({ key: "", weather: null, status: "loading" });
  const retry = useCallback(() => { if (farmStatus === "error") reloadFarms(); else setAttempt(v => v + 1); }, [farmStatus, reloadFarms]);
  useEffect(() => {
    if (farmStatus !== "ready" || !id || latitude == null || longitude == null) return;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setState({ key, weather: null, status: "loading" });
    getWeather({ id, latitude, longitude }, controller.signal).then(weather => {
      if (active) setState({ key, weather, status: "ready" });
    }).catch(() => {
      if (active) setState({ key, weather: null, status: "error" });
    }).finally(() => clearTimeout(timeout));
    const refresh = setInterval(retry, 5 * 60 * 1000);
    return () => { active = false; clearTimeout(timeout); clearInterval(refresh); controller.abort(); };
  }, [key, id, latitude, longitude, farmStatus, attempt, retry]);
  // Never show a previous farm's weather, even for the render before the effect runs.
  let visible: Omit<WeatherState, "retry"> = state.key === key ? state : { weather: null, status: "loading" };
  if (farmStatus === "error") visible = { weather: null, status: "error" };
  else if (farmStatus === "ready" && (!id || latitude == null || longitude == null)) visible = { weather: null, status: "missing-location" };
  return <Context.Provider value={{ ...visible, retry }}>{children}</Context.Provider>;
}
export function useWeather() {
  const value = useContext(Context);
  if (!value) throw new Error("WeatherProvider is missing");
  return value;
}
