import { request } from "@/src/api/http-client";
import { routes } from "@/src/api/routes";

export type Audit = {
  id: string | number;
  audit_name?: string;
  name?: string;
  location?: string | { name?: string };
  auditor?: string;
  status_id?: number;
  status?: string;
};
export type AuditPayload = {
  auditor_id: string | number;
  audit_name: string;
  country: string | number;
  location: string | number;
  work_area?: string;
  observed_at?: string;
  start_time?: string;
  end_time?: string;
  sat_coauditors?: (string | number)[];
  sat_auditees?: (string | number)[];
  form_ids?: (string | number)[];
};
const list = <T>(value: T[] | { rows?: T[]; audits?: T[] }) =>
  Array.isArray(value) ? value : (value.rows ?? value.audits ?? []);

export const auditKeys = {
  all: ["audits"] as const,
  detail: (id: string) => ["audits", id] as const,
};
export async function getAudits(
  scope: "my_audits" | "my_location" = "my_audits",
) {
  return list(
    await request<Audit[] | { rows?: Audit[] }>(
      "sat",
      `${routes.audits}?scope=${scope}`,
    ),
  );
}
export const getAudit = (id: string) =>
  request<Audit>("sat", `${routes.audits}/${encodeURIComponent(id)}`);
export const getAuditForms = (id: string) =>
  request<unknown[]>("sat", `${routes.audits}/${encodeURIComponent(id)}/forms`);
export const getAuditSubmissions = (id: string) =>
  request<unknown[]>(
    "sat",
    `${routes.submissions}?audit_id=${encodeURIComponent(id)}`,
  );
export const getOpeningPairs = (id: string) =>
  request<unknown[]>(
    "sat",
    `${routes.audits}/${encodeURIComponent(id)}/opening-closing-pairs`,
  );
export const createAudit = (payload: AuditPayload) =>
  request<Audit>("sat", routes.audits, { method: "POST", body: payload });
export const updateAuditStatus = (id: string, status_id: 1 | 2 | 3) =>
  request<Audit>("sat", `${routes.audits}/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status_id },
  });
export const getForms = () =>
  request<{ id: string | number; name?: string; form_name?: string }[]>(
    "sat",
    routes.forms,
  );
export const getCountries = () =>
  request<{ id: string | number; name?: string; country_name?: string }[]>(
    "sat",
    routes.countries,
  );
export const getLocations = () =>
  request<{ id: string | number; name?: string; location_name?: string }[]>(
    "sat",
    routes.locations,
  );
