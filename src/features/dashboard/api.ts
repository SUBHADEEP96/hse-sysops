import { request } from "@/src/api/http-client";
import { routes } from "@/src/api/routes";
export const dashboardKeys = { summary: ["dashboard", "summary"] as const };
export async function getDashboard() {
  const [stats, critical, observations] = await Promise.all([
    request<Record<string, unknown>>("sat", routes.dashboard.stats),
    request<unknown[]>("sat", routes.dashboard.critical),
    request<Record<string, unknown>>("sat", routes.dashboard.observations),
  ]);
  return { stats, critical, observations };
}
