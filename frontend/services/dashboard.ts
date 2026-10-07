import { mockDashboard } from "@/data/mock";
import type { DashboardSnapshot } from "@/types/dashboard";
// Replace this adapter with a fetch + contract mapper when the API is ready.
export interface DashboardRepository {
  load(): Promise<DashboardSnapshot>;
}
export const dashboardRepository: DashboardRepository = {
  async load() {
    return structuredClone(mockDashboard);
  },
};
