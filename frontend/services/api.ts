import type { Farm, FarmInput } from "@/types/farm";
const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${base}/api/v1${path}`, {
    ...options,
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error(
      `Request failed (${response.status}). Check your entries and try again.`,
    );
  return response.json();
}
export const createFarm = (profile: FarmInput) =>
  request<Farm>("/farms", { method: "POST", body: JSON.stringify(profile) });
export const getFarm = (id: string) =>
  request<Farm>(`/farms/${encodeURIComponent(id)}`);
