import type { FarmProfile, FarmProfileInput } from "@/types/farm-profile";
const base = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");
export class FarmApiError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}/api/farms${path}`, {
      ...options,
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      signal: options.signal || AbortSignal.timeout(15000),
    });
  } catch {
    throw new FarmApiError(
      "Farm data temporarily unavailable. Check your connection and try again.",
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const fields: Record<string, string> = {};
    if (Array.isArray(body?.detail))
      for (const error of body.detail)
        fields[String(error.loc?.[1] || "form")] = error.msg;
    throw new FarmApiError(
      response.status === 422
        ? "Please check the highlighted fields."
        : response.status === 404
          ? "Farm not found. Refresh your farm list."
          : "Farm data temporarily unavailable. Please try again.",
      fields,
    );
  }
  return response.json() as Promise<T>;
}
export const listFarms = (signal?: AbortSignal) =>
  request<FarmProfile[]>("", { signal });
export const getFarmProfile = (id: string) =>
  request<FarmProfile>(`/${encodeURIComponent(id)}`);
export const saveFarmProfile = (data: FarmProfileInput, id?: string) =>
  request<FarmProfile>(id ? `/${encodeURIComponent(id)}` : "", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(data),
  });
