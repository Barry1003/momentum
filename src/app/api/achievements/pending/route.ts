import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { acknowledgeAchievement, getPendingAchievement } from "@/modules/progress/service";
import { ackAchievementSchema } from "@/modules/progress/validation";
export const runtime = "nodejs";

export async function GET() {
  try { const user = await requiredUser(); return result({ achievement: await getPendingAchievement(user.id) }); }
  catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const { achievementId } = await jsonBody(request, ackAchievementSchema);
    return result(await acknowledgeAchievement(user.id, achievementId));
  } catch (error) { return apiError(error); }
}
