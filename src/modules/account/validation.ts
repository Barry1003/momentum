import { z } from "zod";

export const codeSchema = z.string().regex(/^\d{6}$/, "Codes are 6 digits.");

export const emailChangeSchema = z.object({
  newEmail: z.string().trim().toLowerCase().max(254).pipe(z.email("That email doesn’t look right.")),
}).strict();

export const confirmCodeSchema = z.object({ code: codeSchema }).strict();

export const deletionSchema = z.object({
  code: codeSchema,
  confirmWord: z.string().refine((value) => value === "DELETE", "Type DELETE in capitals to confirm."),
}).strict();
