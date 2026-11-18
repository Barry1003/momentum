import { z } from "zod";

const validTimezone = (timezone: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80).optional(),
  timezone: z.string().trim().max(100).refine(validTimezone, "Invalid IANA timezone").optional(),
  avatarArtStyle: z.enum(["SOFT_3D", "ANIME"]).optional(),
}).strict().refine(value => Object.keys(value).length > 0, "No update fields provided");

export type UpdateProfile = z.infer<typeof updateProfileSchema>;
