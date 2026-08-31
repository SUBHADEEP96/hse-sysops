import { filterAudits, normalizeAuditStatus } from "./model";

describe("audit status view model", () => {
  test.each([
    [1, "open"], ["opened", "open"], [3, "in_progress"],
    ["in progress", "in_progress"], [2, "closed"], ["CLOSED", "closed"],
    [null, "unknown"],
  ])("normalizes %p", (input, expected) => {
    expect(normalizeAuditStatus(input)).toBe(expected);
  });

  test("filters normalized statuses and preserves All", () => {
    const audits = [
      { id: 1, status: "open" },
      { id: 2, status_id: 3 },
      { id: 3, status: "closed" },
    ];
    expect(filterAudits(audits, "all")).toHaveLength(3);
    expect(filterAudits(audits, "open").map(({ id }) => id)).toEqual([1]);
    expect(filterAudits(audits, "in_progress").map(({ id }) => id)).toEqual([2]);
    expect(filterAudits(audits, "closed").map(({ id }) => id)).toEqual([3]);
  });
});
