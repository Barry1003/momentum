import "server-only";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getPrisma } from "@/db/client";
import { sendAuthenticationEmail, sendCodeEmail } from "./email";

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
    rateLimit: { enabled: true, window: 60, max: 20 },
    plugins: [emailOTP({
      otpLength: 6,
      expiresIn: 600,
      // Signup requests its code explicitly, so delivery errors can be shown and retried.
      sendVerificationOnSignUp: false,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        await sendCodeEmail({ to: email, code: otp, type });
      },
    })],
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
      // Do not send a second verification link alongside the OTP.
      sendOnSignUp: false,
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
