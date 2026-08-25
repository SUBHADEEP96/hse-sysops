import { request } from "@/src/api/http-client";
import {
  createAudit,
  getLocations,
  normalizeCountries,
  normalizeLocations,
} from "./api";

jest.mock("@/src/api/http-client", () => ({ request: jest.fn() }));
const mockedRequest = jest.mocked(request);

describe("audit lookup contracts", () => {
  beforeEach(() => mockedRequest.mockReset());

  test("normalizes server identifiers, removes duplicates and rejects invalid countries", () => {
    expect(
      normalizeCountries([
        { country_id: 123, country_name: "Australia" },
        { country_id: "123", country_name: "Duplicate" },
        { country_id: "456", country_name: "India" },
        { country_name: "Missing ID" },
        { country_id: 789 },
      ]),
    ).toEqual([
      { id: "123", name: "Australia" },
      { id: "456", name: "India" },
    ]);
  });

  test("normalizes location envelopes without undefined labels or duplicate keys", () => {
    const locations = normalizeLocations({
      locations: [
        { location_id: 1, location_name: "Perth" },
        { location_id: "1", location_name: "Perth duplicate" },
        { location_id: 2, name: "Sydney" },
        { location_id: 3 },
      ],
    });
    expect(locations).toEqual([
      { id: "1", name: "Perth" },
      { id: "2", name: "Sydney" },
    ]);
    expect(new Set(locations.map(({ id }) => id)).size).toBe(locations.length);
    expect(JSON.stringify(locations)).not.toContain("undefined");
  });

  test("requests only the selected country's dependent location endpoint", async () => {
    mockedRequest.mockResolvedValueOnce([]);
    await getLocations("country 7");
    expect(mockedRequest).toHaveBeenCalledWith(
      "sat",
      "/locations/country/country%207",
    );
  });

  test("submits the exact documented create-audit payload", async () => {
    mockedRequest.mockResolvedValueOnce({ id: 1 });
    const payload = {
      auditor_id: 42,
      audit_name: "Site audit",
      country: "7",
      location: "11",
      work_area: "Workshop",
    };
    await createAudit(payload);
    expect(mockedRequest).toHaveBeenCalledWith("sat", "/audits", {
      method: "POST",
      body: payload,
    });
  });
});
