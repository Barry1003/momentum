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

/** Invite codes look like NORTH-4821 (letters, a dash, 4 digits). */
export const squadCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3,10}-\d{4}$/, "Codes look like NORTH-4821.");

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
