import "server-only";
import { createNeonAuth } from "@neon/auth/next/server";

function requiredEnv(key: "NEON_AUTH_BASE_URL" | "NEON_AUTH_COOKIE_SECRET") {
  const value = process.env[key];
  if (!value) throw new Error(`${key} must be configured for Neon-managed authentication`);
  return value;
}

/** The managed Neon service, not a second Better Auth server in Next.js. */
export const auth = createNeonAuth({
  baseUrl: requiredEnv("NEON_AUTH_BASE_URL"),
  cookies: { secret: requiredEnv("NEON_AUTH_COOKIE_SECRET") },
});
