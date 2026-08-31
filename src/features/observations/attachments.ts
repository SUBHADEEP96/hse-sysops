import type { Attachment } from "./model";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "application/pdf"]);
export function validateAttachment(file: Attachment): string | null {
  if (file.size !== undefined && file.size > MAX_SIZE)
    return "File must be 10 MB or smaller.";
  if (file.mimeType && !ALLOWED.has(file.mimeType))
    return "Choose a JPEG, PNG, or PDF file.";
  return null;
}
export const ObservationAttachmentAdapter = {
  canSubmit: true,
};
