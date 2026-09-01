import { formatAuditDateTime } from "../audits/date";
import { normalizeSavedObservations } from "./model";

describe("saved observation normalization", () => {
  test("keeps saved fields, answer labels and final marked media", () => {
    const marked = "data:image/png;base64,marked-image";
    expect(
      normalizeSavedObservations({
        submissions: [
          {
            submission_id: 42,
            form_name: "Unsafe condition",
            description: "Damaged guard",
            category: { name: "Machinery" },
            risk_level: "High",
            submission_status: "Open",
            responsible_person: { name: "Alex" },
            target_date: "2026-09-10",
            sat_answers: [
              { question_text: "Location", answer_value: "Line 4" },
              { question_text: "Reviewed date", answer_value: "2026-09-01T10:04:08.000Z" },
              { question_text: "Evidence", is_media: true, media: [marked] },
            ],
          },
        ],
      }),
    ).toEqual([
      {
        id: "42",
        submissionId: "42",
        title: "Unsafe condition",
        status: "Open",
        severity: "High",
        details: [
          { label: "Description", value: "Damaged guard" },
          { label: "Category", value: "Machinery" },
          { label: "Responsible person", value: "Alex" },
          { label: "Target date", value: "10 Sep 2026, 12:00 AM" },
          { label: "Location", value: "Line 4" },
          { label: "Reviewed date", value: formatAuditDateTime("2026-09-01T10:04:08.000Z") },
        ],
        images: [marked],
      },
    ]);
  });

  test("omits empty optional values and supports nested response data", () => {
    const observations = normalizeSavedObservations({
      data: {
        rows: [
          {
            id: "7",
            title: "Housekeeping",
            remarks: null,
            corrective_action: "",
            answers: [{ label: "Other detail", value: false }],
            attachments: [{ url: "/uploads/marked.jpg" }],
          },
        ],
      },
    });

    expect(observations[0]).toMatchObject({
      details: [{ label: "Other detail", value: "false" }],
      images: ["/uploads/marked.jpg"],
    });
    expect(JSON.stringify(observations)).not.toMatch(/undefined|null/);
  });

  test("groups answer rows by submission and joins a closing submission to its opening", () => {
    const questions = new Map([
      ["101", { id: 101, label: "What was observed?" }],
      ["201", { id: 201, label: "Corrective action" }],
    ]);
    const observations = normalizeSavedObservations(
      [
        { submission_id: 11, sat_answers: [{ question_id: 101, answer_value: "Guard removed" }] },
        { submission_id: 11, sat_answers: [{ question_id: 105, is_media: true, media: ["data:image/jpeg;base64,first", "data:image/jpeg;base64,second"] }] },
        { submission_id: 12, opening_sub_id: 11, sat_answers: [{ question_id: 201, answer_value: "Guard refitted" }] },
        { submission_id: 13, sat_answers: [{ question_id: 101, answer_value: "Oil spill" }] },
      ],
      questions,
    );

    expect(observations).toHaveLength(2);
    expect(observations[0]).toMatchObject({
      submissionId: "11",
      closingSubmissionId: "12",
      status: "Closed",
      details: [{ label: "What was observed?", value: "Guard removed" }],
      closingDetails: [{ label: "Corrective action", value: "Guard refitted" }],
      images: ["data:image/jpeg;base64,first", "data:image/jpeg;base64,second"],
    });
    expect(observations[1].submissionId).toBe("13");
  });
});
