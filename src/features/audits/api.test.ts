import { request } from "@/src/api/http-client";
import {
    createAudit,
    getAudits,
    getLocations,
    normalizeCountries,
    normalizeForms,
    normalizeLocations,
    updateAuditStatus,
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

  test("normalizes camelCase dependent location fields", () => {
    expect(
      normalizeLocations({
        locations: [
          { locationId: 11, locationName: "Workshop" },
          { locationId: 12, label: "Warehouse" },
        ],
      }),
    ).toEqual([
      { id: "11", name: "Workshop" },
      { id: "12", name: "Warehouse" },
    ]);
  });

  test("normalizes form selection envelopes and names", () => {
    expect(
      normalizeForms({
        forms: [
          { form_id: 1, formName: "Safety" },
          { formId: "2", label: "Environment" },
          { form_id: 1, form_name: "Duplicate" },
        ],
      }),
    ).toEqual([
      { id: "1", name: "Safety" },
      { id: "2", name: "Environment" },
    ]);
  });

  test("requests the documented locations endpoint", async () => {
    mockedRequest.mockResolvedValueOnce([]);
    await getLocations();
    expect(mockedRequest).toHaveBeenCalledWith("sat", "/locations");
  });

  test("normalizes location names and nested data envelopes returned by the API", () => {
    expect(
      normalizeLocations({
        data: [
          { id: 1, location: "Perth" },
          { location_id: 2, location_name: "Sydney" },
        ],
      }),
    ).toEqual([
      { id: "1", name: "Perth" },
      { id: "2", name: "Sydney" },
    ]);
  });

  test("normalizes audit identifiers and removes duplicate or missing rows", async () => {
    mockedRequest.mockResolvedValueOnce({
      audits: [
        { audit_id: 7, audit_name: "First" },
        { id: "7", audit_name: "Duplicate" },
        { audit_name: "Missing ID" },
        { id: 8, audit_name: "Second" },
      ],
    });

    await expect(getAudits()).resolves.toEqual([
      { audit_id: 7, audit_name: "First", id: "7" },
      { id: "8", audit_name: "Second" },
    ]);
  });

  test("normalizes audit status identifiers and nested status objects", async () => {
    mockedRequest.mockResolvedValueOnce({
      audits: [
        { id: 1, audit_name: "Open", audit_status_id: 1 },
        { id: 2, audit_name: "Progress", statusId: "3" },
        { id: 3, audit_name: "Closed", status: { id: 2, name: "Closed" } },
      ],
    });

    await expect(getAudits()).resolves.toEqual([
      { id: "1", audit_name: "Open", audit_status_id: 1, status_id: 1 },
      { id: "2", audit_name: "Progress", statusId: "3", status_id: 3 },
      {
        id: "3",
        audit_name: "Closed",
        status: { id: 2, name: "Closed" },
        status_id: 2,
      },
    ]);
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

  test("normalizes audit_id in the create response for detail navigation", async () => {
    mockedRequest.mockResolvedValueOnce({ audit: { audit_id: 91 } });

    await expect(
      createAudit({
        auditor_id: 42,
        audit_name: "Site audit",
        country: "7",
        location: "11",
      }),
    ).resolves.toMatchObject({ id: "91", audit_id: 91 });
  });

  test("submits the documented audit status field", async () => {
    mockedRequest.mockResolvedValueOnce({ id: 7 });

    await updateAuditStatus("7", 2);

    expect(mockedRequest).toHaveBeenCalledWith("sat", "/audits/7/status", {
      method: "PATCH",
      body: { audit_status_id: 2 },
    });
  });
});
