import { z } from "zod";

const choice = z.string().regex(/^[a-z-]{1,32}$/);
export const lookSchema = z.object({
  name: z.string().trim().min(1, "Names are 1 to 20 characters.").max(20, "Names are 1 to 20 characters.").optional(),
  room: choice.optional(),
  plinth: choice.optional(),
  outfit: choice.optional(),
  accents: z.array(choice).max(8).optional(),
}).strict();
