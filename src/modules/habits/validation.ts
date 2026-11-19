import { z } from "zod";

export const habitDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");

export const createHabitSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(80).optional(),
  icon: z.string().trim().max(80).optional(),
  targetType: z.enum(["CHECK", "COUNT", "DURATION"]).default("CHECK"),
  targetValue: z.number().int().min(1).max(100000).default(1),
  unit: z.string().trim().max(40).optional(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  goalId: z.string().min(1).max(128).optional(),
  sharedWithSquadId: z.string().min(1).max(128).optional(),
}).strict();

export const updateHabitSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  category: z.string().trim().max(80).nullable().optional(),
  icon: z.string().trim().max(80).nullable().optional(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
}).strict().refine(v => Object.keys(v).length > 0);

export const logHabitSchema = z.object({
  value: z.number().int().min(0).max(100000),
}).strict();

export function localDateInTimezone(timestamp: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(timestamp);
  const lookup = (key: string) => parts.find(part => part.type === key)?.value || "";
  return `${lookup("year")}-${lookup("month")}-${lookup("day")}`;
}

export function isCompleted(targetType: "CHECK" | "COUNT" | "DURATION", targetValue: number, value: number): boolean {
  return targetType === "CHECK" ? value >= 1 : value >= targetValue;
}
