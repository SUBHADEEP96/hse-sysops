import { request } from "@/src/api/http-client";
import { routes } from "@/src/api/routes";

export type Audit = {
  id: string | number;
  audit_name?: string;
  name?: string;
  location?: string | { name?: string };
  auditor?: string;
  auditor_name?: string;
  created_at?: string;
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
export type FormOption = { id: string; name: string };

type LookupDto = Record<string, unknown>;
const isRecord = (value: unknown): value is LookupDto =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function normalizeAudit(row: LookupDto): Audit | null {
  const rawId = row.id ?? row.audit_id;
  if (typeof rawId !== "string" && typeof rawId !== "number") return null;
  const id = String(rawId).trim();
  if (!id) return null;

  const rawStatus =
    row.status_id ??
    row.audit_status_id ??
    row.statusId ??
    row.auditStatus ??
    row.status_name ??
    row.audit_status_name ??
    row.audit_status ??
    row.status;
  const status = isRecord(rawStatus)
    ? (rawStatus.id ??
      rawStatus.status_id ??
      rawStatus.name ??
      rawStatus.label ??
      rawStatus.status)
    : rawStatus;
  const normalizedStatusId =
    typeof status === "number"
      ? status
      : typeof status === "string" && /^\d+$/.test(status.trim())
        ? Number(status)
        : undefined;
  const normalizedStatus =
    typeof status === "string" && !/^\d+$/.test(status.trim())
      ? status.trim()
      : undefined;

  return {
    ...row,
    id,
    ...(normalizedStatusId === undefined
      ? {}
      : { status_id: normalizedStatusId }),
    ...(normalizedStatus === undefined ? {} : { status: normalizedStatus }),
  } as Audit;
}

export function normalizeAudits(value: unknown): Audit[] {
  const rows = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.rows)
      ? value.rows
      : isRecord(value) && Array.isArray(value.audits)
        ? value.audits
        : [];
  const unique = new Set<string>();
  const audits: Audit[] = [];
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const audit = normalizeAudit(row);
    if (!audit || unique.has(String(audit.id))) continue;
    unique.add(String(audit.id));
    audits.push(audit);
  }
  return audits;
}

function lookupRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];
  for (const key of ["rows", "countries", "locations", "data"]) {
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

    const aliasesId = [
      idKey,
      idKey.replace(/^./, (letter) => letter.toUpperCase()),
      idKey.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      idKey.replace(/_/g, ""),
      idKey.replace(/^./, (letter) => letter.toUpperCase()).replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      "id",
    ];

    const aliasesName = [
      nameKey,
      nameKey.replace(/^./, (letter) => letter.toUpperCase()),
      nameKey.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      nameKey.replace(/_/g, ""),
      nameKey.replace(/^./, (letter) => letter.toUpperCase()).replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      nameKey === "country_name" ? "country" : "location",
      nameKey === "country_name" ? "Country_name" : "Location_name",
      "name",
      "label",
    ];

    const rawId = aliasesId.find((key) => key in row && row[key] !== undefined);
    const rawName = aliasesName.find((key) => key in row && row[key] !== undefined);
    const idValue = rawId ? row[rawId] : undefined;
    const nameValue = rawName ? row[rawName] : undefined;

    if (
      (typeof idValue !== "string" && typeof idValue !== "number") ||
      (typeof nameValue !== "string" && typeof nameValue !== "number")
    )
      continue;

    const id = String(idValue).trim();
    const name = String(nameValue).trim();
    if (!id || !name || unique.has(id)) continue;
    unique.set(id, { id, name });
  }
  return [...unique.values()];
}

export const normalizeCountries = (value: unknown): Country[] =>
  normalizeLookup(value, "country_id", "country_name");
export const normalizeLocations = (value: unknown): Location[] =>
  normalizeLookup(value, "location_id", "location_name");
export const auditKeys = {
  all: ["audits"] as const,
  detail: (id: string) => ["audits", id] as const,
  countries: ["audit-lookups", "countries"] as const,
  locations: ["audit-lookups", "locations"] as const,
};
export async function getAudits(
  scope: "my_audits" | "my_location" = "my_audits",
) {
  return normalizeAudits(
    await request<unknown>("sat", `${routes.audits}?scope=${scope}`),
  );
}
export const getAudit = (id: string) =>
  request<unknown>("sat", `${routes.audits}/${encodeURIComponent(id)}`).then(
    (value) => {
      const row =
        isRecord(value) && isRecord(value.audit) ? value.audit : value;
      return normalizeAudit(isRecord(row) ? row : {}) ?? { id };
    },
  );
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
export const createAudit = async (payload: AuditPayload) => {
  const value = await request<unknown>("sat", routes.audits, {
    method: "POST",
    body: payload,
  });
  const row = isRecord(value) && isRecord(value.audit) ? value.audit : value;
  return normalizeAudit(isRecord(row) ? row : {}) ?? (value as Audit);
};
export const updateAuditStatus = (id: string, status_id: 1 | 2 | 3) =>
  request<Audit>("sat", `${routes.audits}/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { audit_status_id: status_id },
  });
export const normalizeForms = (value: unknown): FormOption[] => {
  const rows = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.forms)
      ? value.forms
      : isRecord(value) && Array.isArray(value.rows)
        ? value.rows
        : [];
  const unique = new Map<string, FormOption>();
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const rawId = row.id ?? row.form_id ?? row.formId;
    const rawName =
      row.form_name ?? row.formName ?? row.name ?? row.label ?? rawId;
    if (
      (typeof rawId !== "string" && typeof rawId !== "number") ||
      (typeof rawName !== "string" && typeof rawName !== "number")
    )
      continue;
    const id = String(rawId).trim();
    const name = String(rawName).trim();
    if (id && name && !unique.has(id)) unique.set(id, { id, name });
  }
  return [...unique.values()];
};

export const getForms = async () =>
  normalizeForms(await request<unknown>("sat", routes.forms));
export const getCountries = async () =>
  normalizeCountries(await request<unknown>("sat", routes.countries));
export const getLocations = async () =>
  normalizeLocations(await request<unknown>("sat", routes.locations));
export const getLocationsByCountry = async (countryId: string | number) => {
  const raw = await request<unknown>("sat", routes.locations);
  const rows = Array.isArray(raw) ? raw : lookupRows(raw);
  const filtered = rows.filter((row) => {
    if (!isRecord(row)) return false;
    const candidates = [
      row.country_id,
      row.countryId,
      row.country,
      row.country_name,
      row.countryName,
      row.location_country_id,
      row.locationCountryId,
      row.location_country_name,
      row.locationCountryName,
      row.work_area_country_id,
      row.workAreaCountryId,
      row.work_area_country_name,
      row.workAreaCountryName,
    ];
    return candidates.some(
      (value) => value !== undefined && String(value).trim() === String(countryId).trim(),
    );
  });

  return normalizeLocations(filtered.length ? filtered : rows);
};
