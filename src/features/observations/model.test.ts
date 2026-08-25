import { ObservationAttachmentAdapter, validateAttachment } from "./attachments";
import { buildSubmission, calculateRpn } from "./model";

describe("observation contract helpers", () => {
  test.each([[1, 1, 1, false], [4, 8, 32, true], [8, 16, 128, true]])("calculates RPN", (l, s, score, critical) => expect(calculateRpn(l, s)).toMatchObject({ score, valid: true, critical }));
  test("maps opening and closing payloads without submission_type_id", () => {
    const base = { audit_id: 4, submitter_id: 7, form_id: 2, sat_answers: [{ question_id: 1, answer: "safe" }] };
    expect(buildSubmission(base)).toEqual(base);
    expect(buildSubmission({ ...base, opening_sub_id: 10 })).toMatchObject({ opening_sub_id: 10 });
    expect(buildSubmission(base)).not.toHaveProperty("submission_type_id");
  });
  test("validates attachment type and size and isolates missing transport", () => {
    expect(validateAttachment({ uri: "file://a", name: "a.exe", mimeType: "application/x-msdownload" })).toMatch(/JPEG/);
    expect(validateAttachment({ uri: "file://a", name: "a.pdf", mimeType: "application/pdf", size: 11 * 1024 * 1024 })).toMatch(/10 MB/);
    expect(ObservationAttachmentAdapter.canSubmit).toBe(false);
  });
});
