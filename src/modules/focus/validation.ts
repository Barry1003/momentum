import { z } from "zod";

export const sessionKeySchema = z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/);

export const startFocusSchema = z.object({
  sessionKey: sessionKeySchema,
  plannedMinutes: z.number().int().min(1).max(180),
  mode: z.enum(["solo", "squad"]),
  taskId: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/).nullable().optional(),
}).strict();

export const finishFocusSchema = z.object({
  focusedSeconds: z.number().int().min(0).max(180 * 60),
  plannedMinutes: z.number().int().min(1).max(180),
  mode: z.enum(["solo", "squad"]),
  taskId: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/).nullable().optional(),
  stopReason: z.string().trim().max(200).nullable().optional(),
}).strict();

export const quoteSchema = z.object({
  seconds: z.coerce.number().int().min(0).max(180 * 60),
}).strict();
