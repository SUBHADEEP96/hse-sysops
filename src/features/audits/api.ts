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
export type Country = { id: string; name: string };
export type Location = { id: string; name: string };

type LookupDto = Record<string, unknown>;
const isRecord = (value: unknown): value is LookupDto =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function lookupRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];
  for (const key of ["rows", "countries", "locations"]) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
}

function normalizeLookup(
  value: unknown,
  idKey: "country_id" | "location_id",
  nameKey: "country_name" | "location_name",
): { id: string; name: string }[] {
  const unique = new Map<string, { id: string; name: string }>();
  for (const row of lookupRows(value)) {
    if (!isRecord(row)) continue;
    const rawId = row[idKey] ?? row.id;
    const rawName = row[nameKey] ?? row.name;
    if (
      (typeof rawId !== "string" && typeof rawId !== "number") ||
      (typeof rawName !== "string" && typeof rawName !== "number")
    )
      continue;
    const id = String(rawId).trim();
    const name = String(rawName).trim();
    if (!id || !name || unique.has(id)) continue;
    unique.set(id, { id, name });
  }
  return [...unique.values()];
}

export const normalizeCountries = (value: unknown): Country[] =>
  normalizeLookup(value, "country_id", "country_name");
export const normalizeLocations = (value: unknown): Location[] =>
  normalizeLookup(value, "location_id", "location_name");
const list = <T>(value: T[] | { rows?: T[]; audits?: T[] }) =>
  Array.isArray(value) ? value : (value.rows ?? value.audits ?? []);

export const auditKeys = {
  all: ["audits"] as const,
  detail: (id: string) => ["audits", id] as const,
  countries: ["audit-lookups", "countries"] as const,
  locations: (countryId: string | null) =>
    ["audit-lookups", "locations", countryId] as const,
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
export const getCountries = async () =>
  normalizeCountries(await request<unknown>("sat", routes.countries));
export const getLocations = async (countryId: string) =>
  normalizeLocations(
    await request<unknown>("sat", routes.locationsForCountry(countryId)),
  );
