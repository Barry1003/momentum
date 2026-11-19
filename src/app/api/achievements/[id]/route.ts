import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { SquadError } from "@/modules/squads/policy";
import { getAchievement, setAchievementShared } from "@/modules/progress/service";
import { achievementIdSchema, shareAchievementSchema } from "@/modules/progress/validation";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

async function idOf(context: Ctx): Promise<string> {
  const parsed = achievementIdSchema.safeParse((await context.params).id);
  if (!parsed.success) throw new SquadError("NOT_FOUND", 404, "Not found");
  return parsed.data;
}

export async function GET(_: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const achievement = await getAchievement(user.id, await idOf(context));
    if (!achievement) throw new SquadError("NOT_FOUND", 404, "Not found");
    return result({ achievement });
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const id = await idOf(context);
    const { isShared } = await jsonBody(request, shareAchievementSchema);
    return result({ achievement: await setAchievementShared(user.id, id, isShared) });
  } catch (error) { return apiError(error); }
}
