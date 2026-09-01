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
              { question_text: "Evidence", is_media: true, media: [marked] },
            ],
          },
        ],
      }),
    ).toEqual([
      {
        id: "42",
        title: "Unsafe condition",
        status: "Open",
        severity: "High",
        details: [
          { label: "Description", value: "Damaged guard" },
          { label: "Category", value: "Machinery" },
          { label: "Responsible person", value: "Alex" },
          { label: "Target date", value: "2026-09-10" },
          { label: "Location", value: "Line 4" },
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
});
