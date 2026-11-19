import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");

export const goalTaskSchema = z.object({
  title: z.string().trim().min(2).max(120),
  when: z.enum(["today", "tomorrow", "pickDate", "noDate"]),
  date: isoDate.optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
}).strict().refine((value) => value.when !== "pickDate" || Boolean(value.date), { message: "Pick a date", path: ["date"] });

export const milestoneSchema = z.object({
  title: z.string().trim().min(2).max(120),
  criteria: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
}).strict();
