import { request } from "@/src/api/http-client";
import { routes } from "@/src/api/routes";
import { tokenResponseSchema, userSchema, type SessionUser } from "./types";

function normalizeUser(value: unknown): SessionUser {
  if (typeof value !== "object" || value === null)
    return userSchema.parse(value);
  const user = value as Record<string, unknown>;
  return userSchema.parse({
    ...user,
    id: user.id ?? user.userId,
    employee_name: user.employee_name ?? user.employeeName,
    roles: user.roles ?? user.allRoles,
  });
}

function tokenFrom(
  value: ReturnType<typeof tokenResponseSchema.parse>,
  stage: string,
): string {
  const token =
    value.sessionToken ?? value.launchToken ?? value.accessToken ?? value.token;
  if (!token)
    throw new Error(
      `${stage} response did not contain a documented token field.`,
    );
  return token;
}

export async function authenticate(
  email: string,
  password: string,
): Promise<{ token: string; user: SessionUser }> {
  let masterToken: string | undefined;
  let launchToken: string | undefined;
  try {
    const login = tokenResponseSchema.parse(
      await request<unknown>("master", routes.login, {
        method: "POST",
        body: { email, password },
        authenticated: false,
      }),
    );
    masterToken = tokenFrom(login, "Master login");
    const launch = tokenResponseSchema.parse(
      await request<unknown>("master", routes.appLaunch, {
        method: "POST",
        body: { app: "sat" },
        authenticated: false,
        headers: { Authorization: `Bearer ${masterToken}` },
      }),
    );
    launchToken = tokenFrom(launch, "SAT launch");
    const session = tokenResponseSchema.parse(
      await request<unknown>("sat", routes.session, {
        method: "POST",
        authenticated: false,
        headers: { Authorization: `Bearer ${launchToken}` },
      }),
    );
    const user = normalizeUser(session.user ?? login.user);
    return { token: tokenFrom(session, "SAT session"), user };
  } finally {
    masterToken = undefined;
    launchToken = undefined;
  }
}
