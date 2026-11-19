import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Times use HH:MM.");

export const privacySchema = z.object({
  shareCheckedIn: z.boolean(),
  shareFocusStatus: z.boolean(),
  shareFinishedSharedTasks: z.boolean(),
  shareGrowthStage: z.boolean(),
  shareStreaksAndXp: z.boolean(),
}).strict();

export const remindersSchema = z.object({
  morningPlan: z.boolean(),
  morningPlanTime: time,
  eveningCheckIn: z.boolean(),
  eveningCheckInTime: time,
  habitReminders: z.boolean(),
  squadCheers: z.boolean(),
  reviewDay: z.boolean(),
}).strict();

export const quietHoursSchema = z.object({
  enabled: z.boolean(),
  from: time,
  to: time,
  days: z.enum(["everyDay", "weeknights", "weekends", "custom"]),
  customDays: z.array(z.number().int().min(0).max(6)).max(7),
}).strict()
  .refine((value) => value.from !== value.to, { message: "Start and end can’t be the same time.", path: ["to"] })
  .refine((value) => value.days !== "custom" || value.customDays.length > 0, { message: "Pick at least one day.", path: ["customDays"] });

/** Handles are public and unique: 3–15 lowercase letters, numbers or underscores. */
export const handleSchema = z.string().trim().transform((value) => value.replace(/^@/, "").toLowerCase())
  .pipe(z.string().regex(/^[a-z0-9_]{3,15}$/, "Handles are 3–15 letters, numbers or underscores."));

export const profileDetailsSchema = z.object({
  handle: handleSchema,
  intention: z.string().trim().max(140),
}).strict();

/** Handles nobody may take, so they can't be used to impersonate the app. */
export const RESERVED_HANDLES = new Set(["momentum", "admin", "support", "help", "staff", "team", "official", "moderator", "system", "ari"]);
