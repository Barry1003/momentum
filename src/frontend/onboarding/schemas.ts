import { z } from "zod";

export const emailSchema = z.string().trim().min(1, "Enter your email.").email("That doesn't look like an email address.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "At least 2 characters.")
  .max(24, "24 characters max.");

export const companionNameSchema = z
  .string()
  .trim()
  .min(1, "Give your companion a name.")
  .max(20, "20 characters max.");

export const verificationCodeSchema = z.array(z.string().regex(/^\d$/)).length(6);

/** Invite links use high-entropy tokens. Four-digit codes are not secure. */
export const squadCodeSchema = z.string().trim().min(32, "Paste your full invite code.").max(128)
  .regex(/^[A-Za-z0-9_-]+$/, "Paste a valid invite code.");

export const squadNameSchema = z
  .string()
  .trim()
  .min(2, "At least 2 characters.")
  .max(30, "30 characters max.");

/** 0–4 password strength hint for the sign-up meter (UI guidance only). */
export function passwordScore(password: string): number {
  return [
    password.length >= 8,
    password.length >= 12,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password) && /[^\w\s]/.test(password),
  ].filter(Boolean).length;
}
