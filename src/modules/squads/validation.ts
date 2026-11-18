import { z } from "zod";

export const createSquadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  maxMembers: z.number().int().min(3).max(10).default(10),
}).strict();

export const updateSquadSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
}).strict().refine(v => Object.keys(v).length > 0, "At least one field required");

export const invitationSchema = z.object({
  email: z.email().trim().toLowerCase().optional(),
  expiresHours: z.number().int().min(1).max(168).default(48),
  maxUses: z.number().int().min(1).max(10).default(1),
}).strict();

export const memberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
}).strict();

export const transferSchema = z.object({
  userId: z.string().min(1).max(128),
}).strict();
