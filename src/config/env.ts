import { z } from "zod";

const schema = z.object({
  origin: z.string().url(),
  masterPrefix: z.string().startsWith("/"),
  satPrefix: z.string().startsWith("/"),
});

export const env = schema.parse({
  origin:
    process.env.EXPO_PUBLIC_API_ORIGIN ?? "https://api-hse-dummy.eframeehs.in",
  masterPrefix: process.env.EXPO_PUBLIC_MASTER_API_PREFIX ?? "/api/master",
  satPrefix: process.env.EXPO_PUBLIC_SAT_API_PREFIX ?? "/api/sat",
});
