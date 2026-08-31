import {
    buildChartSeries,
    normalizeDashboard,
    normalizeMetrics,
} from "./api";

describe("dashboard normalization", () => {
  test("normalizes documented dashboard sections and preserves zero", () => {
    const result = normalizeDashboard(
      {
        stats: { total: 0, open: 2 },
        audit_completion: [{ label: "Completed", count: 4 }],
        answers_trend: [{ name: "Positive", value: 3 }],
        compliance_line: { compliant: 0 },
        rpn_distribution: { critical: 1 },
        answer_types: { negative: 2 },
      },
      [],
      { observations: [{ status: "Open", count: 0 }] },
    );

    expect(result.sections.map((section) => section.title)).toEqual([
      "Summary",
      "Audit Completion",
      "Answers Trend",
      "Compliance",
      "RPN Distribution",
      "Answer Types",
    ]);
    expect(result.sections[0].metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Total", value: 0 }),
      ]),
    );
    expect(result.observationMetrics).toEqual([
      expect.objectContaining({ label: "Open", value: 0 }),
    ]);
    expect(result.criticalAuditCount).toBe(0);
  });

  test("rejects nested, empty, null and malformed values rather than stringifying", () => {
    const metrics = normalizeMetrics({
      nested: { count: 2 },
      empty: [],
      absent: null,
      malformed: true,
      valid: "Ready",
    });
    expect(metrics).toEqual([
      expect.objectContaining({ label: "Valid", value: "Ready" }),
    ]);
    expect(JSON.stringify(metrics)).not.toContain("[Object Object]");
  });

  test("marks wholly malformed responses as unavailable", () => {
    expect(normalizeDashboard("bad", null, {}).empty).toBe(true);
    expect(normalizeDashboard(null, null, []).criticalAuditCount).toBeNull();
  });

  test("builds chart-ready data from the existing dashboard sections", () => {
    const result = normalizeDashboard(
      {
        stats: { total: 14, compliant: 36 },
        rpn_distribution: { low: 33, medium: 8 },
        answer_types: { "single_selection_dropdown": 112, text: 89 },
      },
      ["a1", "a2"],
      { observations: [{ status: "Open", count: 17 }, { status: "Closed", count: 12 }] },
    );

    expect(buildChartSeries(result.sections[4].metrics)).toEqual([
      expect.objectContaining({ label: "Low", value: 33 }),
      expect.objectContaining({ label: "Medium", value: 8 }),
    ]);
    expect(buildChartSeries(result.observationMetrics)).toEqual([
      expect.objectContaining({ label: "Open", value: 17 }),
      expect.objectContaining({ label: "Closed", value: 12 }),
    ]);
  });
});
