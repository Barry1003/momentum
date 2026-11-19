import { z } from "zod";

export const CHEERS = ["High five", "Keep going", "Proud of you", "You inspired me", "Wave"] as const;
export const CHEERS_PER_DAY = 3;
export const REPORT_REASONS = ["Unkind message", "Spam", "Pressure or harassment", "Something else"] as const;
export const REPORTS_PER_DAY = 5;

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);

export const cheerSchema = z.object({ toUserId: id, message: z.enum(CHEERS) }).strict();
export const momentCheerSchema = z.object({ momentId: z.string().regex(/^[a-z]+:[a-zA-Z0-9_-]{1,128}(:[a-z0-9-]{1,64})?$/) }).strict();
export const muteSchema = z.object({ mutedUserId: id, muted: z.boolean() }).strict();
export const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(500),
  reportedUserId: id.nullable().optional(),
}).strict();
export const sharedGoalPrefsSchema = z.object({ linkTask: z.boolean(), showCount: z.boolean(), showNames: z.boolean() }).strict();
