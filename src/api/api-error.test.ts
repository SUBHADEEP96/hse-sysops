import { ApiError, normalizeApiError } from "./api-error";
describe("API errors", () => {
  test("normalizes documented envelopes", () => {
    expect(
      normalizeApiError(403, { success: false, message: "Denied" }),
    ).toEqual(expect.objectContaining({ status: 403, message: "Denied" }));
  });
  test("uses safe fallback", () =>
    expect(normalizeApiError(500, "html")).toBeInstanceOf(ApiError));
});
