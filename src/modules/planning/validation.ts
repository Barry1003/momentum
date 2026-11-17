import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");

export const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(120),
  why: z.string().trim().max(2000).optional(),
  area: z.string().trim().max(80).optional(),
  squadId: z.string().min(1).max(128).optional(),
  targetDate: isoDate.optional(),
}).strict();

export const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  why: z.string().trim().max(2000).nullable().optional(),
  area: z.string().trim().max(80).nullable().optional(),
  targetDate: isoDate.nullable().optional(),
}).strict().refine(v => Object.keys(v).length > 0);

export const taskFieldsSchema = z.object({
  title: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(2000).optional(),
  dueDate: isoDate.optional(),
  dueTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  durationMin: z.number().int().min(1).max(1440).optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("NONE"),
  visibility: z.enum(["PRIVATE", "SQUAD"]).default("PRIVATE"),
  quadrant: z.enum(["DO", "PLAN", "RECONSIDER", "LEAVE"]).optional(),
  goalId: z.string().min(1).max(128).optional(),
  squadId: z.string().min(1).max(128).optional(),
  assigneeId: z.string().min(1).max(128).optional(),
}).strict();
export const createTaskSchema = taskFieldsSchema;
export const updateTaskSchema = taskFieldsSchema.partial().refine(v => Object.keys(v).length > 0);
export const completeTaskSchema = z.object({ occurrenceDate: isoDate }).strict();

export function asUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}
