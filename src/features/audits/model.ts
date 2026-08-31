import type { Audit } from "./api";

export type NormalizedAuditStatus =
  | "open"
  | "in_progress"
  | "closed"
  | "unknown";

export type AuditStatusFilter = "all" | Exclude<NormalizedAuditStatus, "unknown">;

export function normalizeAuditStatus(value: unknown): NormalizedAuditStatus {
  const candidate =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>).id ??
        (value as Record<string, unknown>).status_id ??
        (value as Record<string, unknown>).name ??
        (value as Record<string, unknown>).status
      : value;
  const normalized = String(candidate ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (normalized === "1" || normalized === "open" || normalized === "opened")
    return "open";
  if (normalized === "2" || normalized === "closed") return "closed";
  if (normalized === "3" || normalized === "in_progress") return "in_progress";
  return "unknown";
}

export function auditStatus(audit: Audit): NormalizedAuditStatus {
  return normalizeAuditStatus(audit.status_id ?? audit.status);
}

export function filterAudits(audits: Audit[], filter: AuditStatusFilter) {
  return filter === "all"
    ? audits
    : audits.filter((audit) => auditStatus(audit) === filter);
}

export function auditStatusLabel(status: NormalizedAuditStatus) {
  if (status === "in_progress") return "In Progress";
  if (status === "unknown") return "Unknown";
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}
