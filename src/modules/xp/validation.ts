import { z } from "zod";
export const eventIdSchema = z.object({ eventId: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/) }).strict();
