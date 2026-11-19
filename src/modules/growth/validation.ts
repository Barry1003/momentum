import { z } from "zod";

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
export const ICONS = ["rest", "learning", "work", "people", "health", "money", "home", "spark"] as const;
export const RHYTHMS = ["once", "daily", "weekly", "monthly", "seasonal"] as const;
export const OBSTACLES = ["Time", "Energy", "Unclear next step", "Motivation", "Health", "Something else"] as const;
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour time, like 17:30.");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ---- stored shapes (checked again on every read)
export const areaSchema = z.object({ id, name: z.string().min(1).max(40), icon: z.enum(ICONS), rating: z.number().int().min(1).max(5).nullable(), note: z.string().max(280) });
export const gridActionSchema = z.object({
  id, areaId: id, title: z.string().min(1).max(80), minutes: z.number().int().min(1).max(600),
  addAs: z.enum(["task", "habit"]), rhythm: z.enum(RHYTHMS), status: z.enum(["draft", "suggestion", "accepted"]),
  rhythmChangedByYou: z.boolean(), linkedId: z.string().max(128).nullable().optional(),
});
export const gridSchema = z.object({
  goalId: z.string().max(128), goalTitle: z.string().max(120), why: z.string().max(280),
  areas: z.array(z.object({ id, name: z.string().min(1).max(40), isDraft: z.boolean() })).max(8),
  actions: z.array(gridActionSchema).max(64),
});
export const storedAreasSchema = z.array(areaSchema).max(12);
export const storedAnswersSchema = z.record(z.string(), z.string().max(2000));

// ---- requests
export const rateSchema = z.object({ rating: z.number().int().min(1).max(5).nullable(), note: z.string().trim().max(280) }).strict();
export const auditAreasSchema = z.object({ areas: z.array(z.object({ id: id.nullable(), name: z.string().trim().max(40) }).strict()).min(1).max(12) }).strict();
export const answerSchema = z.object({ answer: z.string().trim().max(2000) }).strict();
export const centralGoalSchema = z.object({
  goalId: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/).nullable(),
  newTitle: z.string().trim().min(2).max(120).optional(),
  why: z.string().trim().max(280),
  keepGrid: z.boolean().optional(),
}).strict();
export const suggestedGridSchema = z.object({ blank: z.boolean() }).strict();
export const renameAreaSchema = z.object({ name: z.string().trim().min(2, "Area names need at least 2 characters.").max(30) }).strict();
export const gridActionInputSchema = z.object({
  id: id.nullable(), areaId: id, title: z.string().trim().min(2, "Give the action a short name.").max(80),
  minutes: z.number().int().min(1, "Duration is 1 to 600 minutes.").max(600, "Duration is 1 to 600 minutes."),
  addAs: z.enum(["task", "habit"]), rhythm: z.enum(RHYTHMS),
}).strict();
export const rhythmSchema = z.object({ rhythm: z.enum(RHYTHMS) }).strict();
export const acceptSchema = z.object({
  as: z.enum(["task", "habit"]),
  habit: z.object({ days: z.array(z.number().int().min(0).max(6)).min(1, "Pick at least one day.").max(7), targetMinutes: z.number().int().min(1).max(600), reminderTime: time.nullable() }).strict().optional(),
}).strict();
export const quadrantSchema = z.object({ quadrant: z.enum(["doNext", "planTime", "reconsider", "leaveRoom"]) }).strict();
export const scheduleSchema = z.object({ date: isoDate, time, repeatsDaily: z.boolean() }).strict();
export const slotQuerySchema = z.object({ date: isoDate, time: z.string().max(5) }).strict();
export const reviewSchema = z.object({
  obstacles: z.array(z.enum(OBSTACLES)).max(6),
  context: z.string().trim().max(280),
  changes: z.array(z.object({ id: z.string().max(64), kind: z.enum(["keep", "smaller", "new"]), title: z.string().trim().max(80), detail: z.string().trim().max(120), draftActionId: z.string().max(64).nullable().optional() }).strict()).max(12),
  finish: z.boolean(),
}).strict();
