import { request } from "@/src/api/http-client";
import { routes } from "@/src/api/routes";

type DashboardStatsDto = {
  stats?: unknown;
  audit_completion?: unknown;
  auditCompletion?: unknown;
  answers_trend?: unknown;
  answersTrend?: unknown;
  compliance_line?: unknown;
  complianceLine?: unknown;
  rpn_distribution?: unknown;
  rpnDistribution?: unknown;
  answer_types?: unknown;
  answerTypes?: unknown;
};

export type DashboardMetric = {
  key: string;
  label: string;
  value: number | string;
};

export type DashboardSection = {
  key: string;
  title: string;
  metrics: DashboardMetric[];
};

export type DashboardViewModel = {
  sections: DashboardSection[];
  criticalAuditCount: number | null;
  observationMetrics: DashboardMetric[];
  empty: boolean;
};

const SECTION_FIELDS = [
  ["stats", "Summary"],
  ["audit_completion", "Audit Completion"],
  ["answers_trend", "Answers Trend"],
  ["compliance_line", "Compliance"],
  ["rpn_distribution", "RPN Distribution"],
  ["answer_types", "Answer Types"],
] as const;

const METRIC_LABELS: Record<string, string> = {
  open: "Open",
  closed: "Closed",
  completed: "Completed",
  pending: "Pending",
  in_progress: "In Progress",
  compliant: "Compliant",
  non_compliant: "Non-compliant",
  positive: "Positive",
  negative: "Negative",
  total: "Total",
  count: "Count",
  percentage: "Percentage",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const scalar = (value: unknown): number | string | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
};

const readableLabel = (key: string) =>
  METRIC_LABELS[key] ??
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function normalizeMetrics(value: unknown): DashboardMetric[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => {
      if (!isRecord(item)) return [];
      const labelValue = item.label ?? item.name ?? item.status ?? item.type;
      const metricValue =
        item.value ?? item.count ?? item.total ?? item.percentage;
      const normalized = scalar(metricValue);
      const label = scalar(labelValue);
      if (normalized === null || label === null) return [];
      return [
        {
          key: `${String(label)}-${index}`,
          label: String(label),
          value: normalized,
        },
      ];
    });
  }
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, item]) => {
    const normalized = scalar(item);
    return normalized === null
      ? []
      : [{ key, label: readableLabel(key), value: normalized }];
  });
}

function sectionValue(dto: DashboardStatsDto, key: string): unknown {
  const camel = key.replace(/_([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
  return (
    dto[key as keyof DashboardStatsDto] ??
    dto[camel as keyof DashboardStatsDto]
  );
}

export function normalizeDashboard(
  statsResponse: unknown,
  criticalResponse: unknown,
  observationsResponse: unknown,
): DashboardViewModel {
  const dto: DashboardStatsDto = isRecord(statsResponse) ? statsResponse : {};
  const sections = SECTION_FIELDS.flatMap(([key, title]) => {
    const metrics = normalizeMetrics(sectionValue(dto, key));
    return metrics.length ? [{ key, title, metrics }] : [];
  });
  const criticalRows = Array.isArray(criticalResponse)
    ? criticalResponse
    : isRecord(criticalResponse) && Array.isArray(criticalResponse.audits)
      ? criticalResponse.audits
      : null;
  const observationValue =
    isRecord(observationsResponse) && "observations" in observationsResponse
      ? observationsResponse.observations
      : observationsResponse;
  const observationMetrics = normalizeMetrics(observationValue);
  return {
    sections,
    criticalAuditCount: criticalRows?.length ?? null,
    observationMetrics,
    empty:
      sections.length === 0 &&
      criticalRows?.length !== 0 &&
      observationMetrics.length === 0,
  };
}

export const dashboardKeys = { summary: ["dashboard", "summary"] as const };

export async function getDashboard(): Promise<DashboardViewModel> {
  const [stats, critical, observations] = await Promise.all([
    request<unknown>("sat", routes.dashboard.stats),
    request<unknown>("sat", routes.dashboard.critical),
    request<unknown>("sat", routes.dashboard.observations),
  ]);
  return normalizeDashboard(stats, critical, observations);
}
