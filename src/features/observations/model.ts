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
