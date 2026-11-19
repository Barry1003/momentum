import { z } from "zod";

export const checkInSchema = z.object({
  mood: z.enum(["heavy", "low", "okay", "good", "bright"]),
  effort: z.enum(["rest", "light", "steady", "strong", "allIn"]),
  win: z.string().trim().max(500),
  obstacle: z.string().trim().max(500),
  shareCheckedIn: z.boolean(),
}).strict();

export const achievementIdSchema = z.string().regex(/^[a-z0-9-]{1,64}$/);

export const shareAchievementSchema = z.object({ isShared: z.boolean() }).strict();

export const ackAchievementSchema = z.object({ achievementId: achievementIdSchema }).strict();
