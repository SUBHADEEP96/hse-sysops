import { formatAuditDateTime } from "@/src/features/audits/date";

export type AnswerValue =
  | string
  | number
  | boolean
  | (string | number)[]
  | Attachment[]
  | null;
export type Attachment = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
  originalUri?: string;
  annotated?: boolean;
};
export type Question = {
  id: string | number;
  label?: string;
  question?: string;
  required?: boolean;
  is_required?: boolean;
  type?: string;
  question_type?: string | { name?: string };
  options?: {
    id: string | number;
    label?: string;
    option?: string;
    value?: string | number;
  }[];
  metadata?: { role?: "likelihood" | "severity" | "rpn" };
  allow_multiple?: boolean;
  multiple?: boolean;
};
export type DynamicForm = {
  id: string | number;
  name?: string;
  form_name?: string;
  sections?: { id: string | number; name?: string; questions?: Question[] }[];
  questions?: Question[];
};
export type SatAnswer = {
  question_id: string | number;
  answer_value?: string | number | boolean | (string | number)[] | null;
  is_media?: boolean;
  media?: string[];
};
export type SubmissionPayload = {
  audit_id: string | number;
  submitter_id: string | number;
  form_id: string | number;
  sat_answers: SatAnswer[];
  opening_sub_id?: string | number;
};

export type ObservationDetail = {
  label: string;
  value: string;
};

export type SavedObservation = {
  id?: string;
  submissionId?: string;
  closingSubmissionId?: string;
  title?: string;
  status?: string;
  severity?: string;
  createdAt?: string;
  submitter?: string;
  details: ObservationDetail[];
  closingDetails?: ObservationDetail[];
  images: string[];
  closingImages?: string[];
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const displayText = (value: unknown): string | undefined => {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) {
    const values = value.flatMap((item) => displayText(item) ?? []);
    return values.length ? values.join(", ") : undefined;
  }
  if (isRecord(value))
    return displayText(
      value.name ?? value.label ?? value.title ?? value.value ?? value.answer_value,
    );
  return undefined;
};

const imageValues = (value: unknown): string[] => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed &&
      (/^data:image\//i.test(trimmed) ||
        /^https?:\/\//i.test(trimmed) ||
        /^\//.test(trimmed))
      ? [trimmed]
      : [];
  }
  if (Array.isArray(value)) return value.flatMap(imageValues);
  if (isRecord(value))
    return imageValues(value.url ?? value.uri ?? value.path ?? value.media);
  return [];
};

const first = (row: UnknownRecord, keys: string[]) => {
  for (const key of keys) {
    const value = displayText(row[key]);
    if (value) return value;
  }
  return undefined;
};

const formatObservationValue = (label: string, value: string) =>
  /date|time/i.test(label) || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
    ? formatAuditDateTime(value)
    : value;

const semanticFields: [string, string[], "date"?][] = [
  ["Description", ["description", "observation_description"]],
  ["Category", ["category", "category_name"]],
  ["Remarks", ["remarks", "remark", "comments"]],
  ["Recommended action", ["recommended_action", "corrective_action", "recommendation"]],
  ["Responsible person", ["responsible_person", "assignee", "assigned_to", "responsible_person_name"]],
  ["Created date", ["created_at", "created_date"], "date"],
  ["Target date", ["target_date", "due_date"], "date"],
  ["Location", ["location", "location_name"]],
];

/** Normalizes only values present in the submission-list response. */
export function normalizeSavedObservations(
  value: unknown,
  questionsById: ReadonlyMap<string, Question> = new Map(),
): SavedObservation[] {
  const source = isRecord(value) && isRecord(value.data) ? value.data : value;
  const items = Array.isArray(source)
    ? source
    : isRecord(source)
      ? ["submissions", "observations", "rows", "data"].flatMap((key) =>
          Array.isArray(source[key]) ? source[key] : [],
        )
      : [];

  const submissions = items.flatMap((item) => {
    if (!isRecord(item)) return [];
    const details: ObservationDetail[] = [];
    for (const [label, keys, type] of semanticFields) {
      const value = first(item, keys);
      if (value)
        details.push({
          label,
          value: type === "date" ? formatAuditDateTime(value) : value,
        });
    }

    const answers = Array.isArray(item.sat_answers)
      ? item.sat_answers
      : Array.isArray(item.answers)
        ? item.answers
        : [];
    const images = [item.media, item.images, item.attachments].flatMap(imageValues);
    for (const answer of answers) {
      if (!isRecord(answer)) continue;
      images.push(...imageValues(answer.media ?? answer.images ?? answer.attachments));
      const rawValue = answer.answer_value ?? answer.answer ?? answer.value;
      const valueText = displayText(rawValue);
      const questionId = displayText(answer.question_id ?? answer.questionId);
      const definition = questionId ? questionsById.get(questionId) : undefined;
      const label = first(answer, [
        "question_label",
        "question_text",
        "label",
        "question",
      ]) ?? definition?.label ?? definition?.question;
      if (label && valueText && imageValues(rawValue).length === 0)
        details.push({ label, value: formatObservationValue(label, valueText) });
    }

    const id = first(item, ["submission_id", "id"]);
    return [{
      id,
      ...(id ? { submissionId: id } : {}),
      ...(first(item, ["opening_sub_id"])
        ? { openingId: first(item, ["opening_sub_id"]) }
        : {}),
      title: first(item, ["observation_title", "observation_type", "form_name", "title", "name"]),
      status: first(item, ["status", "submission_status", "status_name"]),
      severity: first(item, ["severity", "risk_level", "severity_name", "rpn"]),
      ...((() => {
        const created = first(item, ["created_at", "created_date"]);
        return created && !Number.isNaN(new Date(created).getTime())
          ? { createdAt: formatAuditDateTime(created) }
          : {};
      })()),
      ...(first(item, ["submitter_name", "submitted_by", "auditor_name", "submitter"])
        ? { submitter: first(item, ["submitter_name", "submitted_by", "auditor_name", "submitter"]) }
        : {}),
      details,
      images,
    }];
  });

  type Intermediate = SavedObservation & { openingId?: string };
  const grouped = [...submissions.reduce((result, submission) => {
    const key = submission.submissionId ?? `anonymous-${result.size}`;
    const existing = result.get(key);
    if (!existing) result.set(key, submission);
    else {
      existing.details = [...existing.details, ...submission.details].filter(
        (detail, index, all) =>
          all.findIndex((candidate) => candidate.label === detail.label && candidate.value === detail.value) === index,
      );
      existing.images.push(...submission.images);
    }
    return result;
  }, new Map<string, Intermediate>()).values()];
  const openings = grouped.filter((submission) => !submission.openingId);
  const openingIds = new Set(openings.map((submission) => submission.submissionId));
  const orphanClosings = grouped.filter(
    (submission) =>
      (submission as Intermediate).openingId &&
      !openingIds.has((submission as Intermediate).openingId),
  );
  return [...openings, ...orphanClosings].map((submission) => {
    const closing = grouped.find(
      (candidate) =>
        (candidate as Intermediate).openingId === submission.submissionId,
    );
    const { openingId: _openingId, ...opening } = submission;
    if (!closing) return opening;
    return {
      ...opening,
      status: "Closed",
      closingSubmissionId: closing.submissionId,
      closingDetails: closing.details,
      closingImages: closing.images,
    };
  });
}
export function buildSubmission(payload: SubmissionPayload): SubmissionPayload {
  return payload;
}
export function calculateRpn(likelihood: number, severity: number) {
  const score = likelihood * severity;
  return {
    score,
    valid: [1, 2, 4, 8, 16, 32, 64, 128].includes(score),
    critical: score >= 32 && score <= 128,
  };
}

export function toggleMultiSelect(
  current: AnswerValue,
  option: string | number,
  optionOrder: (string | number)[],
): (string | number)[] {
  const selected = new Set<string | number>(
    Array.isArray(current)
      ? current.filter(
          (value): value is string | number =>
            typeof value === "string" || typeof value === "number",
        )
      : [],
  );
  if (selected.has(option)) selected.delete(option);
  else selected.add(option);
  return optionOrder.filter((value) => selected.has(value));
}
