import { request } from "@/src/api/http-client";
import { authenticate } from "./api";
jest.mock("@/src/api/http-client", () => ({ request: jest.fn() }));
const mocked = jest.mocked(request);
describe("three-stage authentication", () => {
  beforeEach(() => mocked.mockReset());
  test("exchanges Master login through SAT session", async () => {
    mocked
      .mockResolvedValueOnce({
        token: "master",
        user: { id: 9, email: "a@b.com" },
      })
      .mockResolvedValueOnce({ launchToken: "launch" })
      .mockResolvedValueOnce({
        sessionToken: "session",
        user: { id: 9, email: "a@b.com" },
      });
    await expect(authenticate("a@b.com", "secret")).resolves.toEqual({
      token: "session",
      user: expect.objectContaining({ id: 9 }),
    });
    expect(mocked).toHaveBeenNthCalledWith(
      2,
      "master",
      "/auth/app-launch",
      expect.objectContaining({
        body: { app: "sat" },
        headers: { Authorization: "Bearer master" },
      }),
    );
  });
  test("normalizes the Master user response fields", async () => {
    mocked
      .mockResolvedValueOnce({
        token: "master",
        user: {
          userId: 9,
          email: "a@b.com",
          employeeName: "Admin User",
          allRoles: ["admin"],
        },
      })
      .mockResolvedValueOnce({ launchToken: "launch" })
      .mockResolvedValueOnce({ sessionToken: "session" });

    await expect(authenticate("a@b.com", "secret")).resolves.toEqual({
      token: "session",
      user: expect.objectContaining({
        id: 9,
        employee_name: "Admin User",
        roles: ["admin"],
      }),
    });
  });
  test.each([1, 2, 3])("propagates failure at stage %i", async (stage) => {
    for (let i = 1; i < stage; i++)
      mocked.mockResolvedValueOnce(
        i === 1
          ? { token: "master", user: { id: 1 } }
          : { launchToken: "launch" },
      );
    mocked.mockRejectedValueOnce(new Error("stage failed"));
    await expect(authenticate("a@b.com", "secret")).rejects.toThrow(
      "stage failed",
    );
  });
});
