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
