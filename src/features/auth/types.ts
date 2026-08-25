import { z } from "zod";

export const userSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    email: z.string().email().optional(),
    employee_name: z.string().optional(),
    name: z.string().optional(),
    roles: z
      .array(z.union([z.string(), z.object({ name: z.string() })]))
      .optional(),
  })
  .passthrough();
export type SessionUser = z.infer<typeof userSchema>;

export const tokenResponseSchema = z
  .object({
    token: z.string().min(1).optional(),
    accessToken: z.string().min(1).optional(),
    launchToken: z.string().min(1).optional(),
    sessionToken: z.string().min(1).optional(),
    user: z.unknown().optional(),
  })
  .passthrough();
