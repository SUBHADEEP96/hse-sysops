import * as FileSystem from "expo-file-system/legacy";
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
  explanation: "Media encoding ready",
  /**
   * Convert attachments to base64 data URLs for API submission.
   * Each attachment is converted to a data URL with the appropriate mime type.
   */
  async encode(attachments: Attachment[]): Promise<string[]> {
    const result: string[] = [];
    for (const attachment of attachments) {
      const mimeType = attachment.mimeType || "application/octet-stream";
      const base64 = await FileSystem.readAsStringAsync(attachment.uri, {
        encoding: "base64",
      });
      result.push(`data:${mimeType};base64,${base64}`);
    }
    return result;
  },
};
