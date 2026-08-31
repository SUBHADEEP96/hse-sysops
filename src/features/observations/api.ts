import { request, requestMultipart } from "@/src/api/http-client";
import { routes } from "@/src/api/routes";
import type { Attachment, DynamicForm, Question, SubmissionPayload } from "./model";
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;

function normalizeQuestion(value: unknown): Question | null {
  if (!isRecord(value)) return null;
  const id = value.id ?? value.question_id ?? value.questionId;
  if (typeof id !== "string" && typeof id !== "number") return null;
  const requiredValue = value.required ?? value.is_required ?? value.isRequired;
  const options = Array.isArray(value.options)
    ? value.options.flatMap((option) => {
        if (!isRecord(option)) return [];
        const optionId = option.id ?? option.option_id ?? option.optionId;
        if (typeof optionId !== "string" && typeof optionId !== "number")
          return [];
        return [
          {
            id: optionId,
            label: text(option.label ?? option.option ?? option.name),
            value:
              typeof option.value === "string" ||
              typeof option.value === "number"
                ? option.value
                : undefined,
          },
        ];
      })
    : undefined;
  return {
    ...value,
    id,
    label: text(value.label ?? value.question_text ?? value.questionText),
    question_type: text(value.question_type ?? value.questionType),
    required: typeof requiredValue === "boolean" ? requiredValue : undefined,
    options,
  };
}

export function normalizeDynamicForm(value: unknown): DynamicForm | null {
  const root = isRecord(value) && isRecord(value.form) ? value.form : value;
  if (!isRecord(root)) return null;
  const id = root.id ?? root.form_id ?? root.formId;
  if (typeof id !== "string" && typeof id !== "number") return null;
  const questions = Array.isArray(root.questions)
    ? root.questions.flatMap((question) => {
        const normalized = normalizeQuestion(question);
        return normalized ? [normalized] : [];
      })
    : undefined;
  const sections = Array.isArray(root.sections)
    ? root.sections.flatMap((section, index) => {
        if (!isRecord(section)) return [];
        const sectionQuestions = Array.isArray(section.questions)
          ? section.questions.flatMap((question) => {
              const normalized = normalizeQuestion(question);
              return normalized ? [normalized] : [];
            })
          : [];
        const sectionId = section.id ?? section.section_id ?? index;
        return [
          {
            id:
              typeof sectionId === "string" || typeof sectionId === "number"
                ? sectionId
                : index,
            name: text(section.name ?? section.section_name),
            questions: sectionQuestions,
          },
        ];
      })
    : undefined;
  return {
    id,
    name: text(root.name ?? root.form_name ?? root.formName),
    form_name: text(root.form_name ?? root.formName),
    questions,
    sections,
  };
}

export const getDynamicForm = (id: string) =>
  request<unknown>(
    "sat",
    `${routes.dynamicForm}/${encodeURIComponent(id)}`,
  ).then((value) => normalizeDynamicForm(value) ?? { id });

export async function uploadAttachment(
  submissionId: string | number,
  attachment: Attachment,
  index: number = 0,
): Promise<void> {
  const formData = new FormData();
  formData.append("index", String(index));

  // Read file from URI and append as Blob
  const base64 = await FileSystem.readAsStringAsync(attachment.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], {
    type: attachment.mimeType || "application/octet-stream",
  });
  formData.append("file", blob, attachment.name);

  await requestMultipart<void>(
    `${routes.submissions}/${encodeURIComponent(submissionId)}/media`,
    formData,
  );
}

export type SubmissionResult = {
  id?: string | number;
  submission_id?: string | number;
  [key: string]: unknown;
};

export async function submitObservation(
  payload: SubmissionPayload,
  attachments: Attachment[] = [],
): Promise<SubmissionResult> {
  const result = await request<SubmissionResult>("sat", routes.submissions, {
    method: "POST",
    body: payload,
  });
  const submissionId = result.id ?? result.submission_id;

  if (submissionId && attachments.length > 0) {
    await Promise.all(
      attachments.map((attachment, index) =>
        uploadAttachment(submissionId, attachment, index),
      ),
    );
  }

  return result;
}
export const getLikelihood = () =>
  request<{ likelihood_of_harm: string; value: number }[]>(
    "sat",
    routes.likelihood,
  );
export const getSeverity = () =>
  request<{ severity_of_harm: string; value: number }[]>(
    "sat",
    routes.severity,
  );
