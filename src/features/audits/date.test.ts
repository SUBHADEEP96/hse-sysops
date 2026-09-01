import { formatAuditDateTime } from "./date";

describe("formatAuditDateTime", () => {
  test("formats timestamps with a readable local date and 12-hour time", () => {
    const timestamp = "2026-09-01T10:04:08.000Z";
    const local = new Date(timestamp);
    const expectedHour = local.getHours() % 12 || 12;
    const period = local.getHours() < 12 ? "AM" : "PM";

    expect(formatAuditDateTime(timestamp)).toBe(
      `${String(local.getDate()).padStart(2, "0")} Sep 2026, ${String(expectedHour).padStart(2, "0")}:${String(local.getMinutes()).padStart(2, "0")} ${period}`,
    );
    expect(formatAuditDateTime(timestamp)).not.toContain("T10:04:08.000Z");
  });

  test("keeps an unparseable server value available instead of showing Invalid Date", () => {
    expect(formatAuditDateTime("date unavailable")).toBe("date unavailable");
  });
});
