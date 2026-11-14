import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getPrisma } from "@/db/client";
import { sendAuthenticationEmail } from "./email";

export function getAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || !baseURL) {
    throw new Error("BETTER_AUTH_SECRET and BETTER_AUTH_URL must be configured");
  }
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleEnabled = Boolean(googleClientId && googleClientSecret);

  return betterAuth({
    secret,
    baseURL,
    database: prismaAdapter(getPrisma(), { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendAuthenticationEmail({
          to: user.email, subject: "Reset your Momentum password", url, action: "reset",
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendAuthenticationEmail({
          to: user.email, subject: "Verify your Momentum email", url, action: "verify",
        });
      },
    },
    socialProviders: googleEnabled
      ? { google: { clientId: googleClientId!, clientSecret: googleClientSecret! } }
      : {},
    advanced: { defaultCookieAttributes: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" } },
  });
}
