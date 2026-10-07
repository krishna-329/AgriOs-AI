"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { FarmProfile, FarmProfileInput } from "@/types/farm-profile";
import { listFarms, saveFarmProfile } from "@/services/farms";
const STORAGE_KEY = "agrios.selectedFarmId";
type FarmContextValue = {
  farms: FarmProfile[];
  selectedFarm: FarmProfile | null;
  status: "loading" | "ready" | "error";
  saving: boolean;
  error: string | null;
  selectFarm: (id: string) => void;
  reloadFarms: () => void;
  saveFarm: (data: FarmProfileInput, id?: string) => Promise<FarmProfile>;
};
const Context = createContext<FarmContextValue | null>(null);
export function FarmProvider({ children }: { children: React.ReactNode }) {
  const [farms, setFarms] = useState<FarmProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<FarmContextValue["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const reloadFarms = useCallback(() => setAttempt(value => value + 1), []);
  const remember = useCallback((id: string | null) => {
    setSelectedId(id);
    try { if (id) localStorage.setItem(STORAGE_KEY, id); else localStorage.removeItem(STORAGE_KEY); } catch { /* Selection still works when browser storage is disabled. */ }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setStatus("loading"); setError(null);
    listFarms(controller.signal).then(items => {
      if (!active) return;
      let stored: string | null = null;
      try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* Session-only selection. */ }
      setFarms(items);
      remember(items.find(farm => farm.id === stored)?.id || items[0]?.id || null);
      setStatus("ready");
    }).catch(err => {
      if (active) { setStatus("error"); setError(err.message); }
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt, remember]);
  const selectFarm = useCallback((id: string) => {
    if (!savingRef.current && farms.some(farm => farm.id === id)) remember(id);
  }, [farms, remember]);
  const saveFarm = useCallback(async (data: FarmProfileInput, id?: string) => {
    if (savingRef.current) throw new Error("A farm is already being saved.");
    savingRef.current = true; setSaving(true);
    try {
      const farm = await saveFarmProfile(data, id);
      setFarms(items => id ? items.map(item => item.id === id ? farm : item) : [...items, farm]);
      if (!id) remember(farm.id);
      return farm;
    } finally { savingRef.current = false; setSaving(false); }
  }, [remember]);
  const selectedFarm = status === "ready" ? farms.find(farm => farm.id === selectedId) || null : null;
  return <Context.Provider value={{ farms, selectedFarm, status, saving, error, selectFarm, reloadFarms, saveFarm }}>{children}</Context.Provider>;
}
export function useFarm() {
  const value = useContext(Context);
  if (!value) throw new Error("FarmProvider is missing");
  return value;
}
