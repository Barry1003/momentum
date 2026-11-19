import { apiError, requiredUser, result } from "@/modules/squads/http";
import { listAchievements } from "@/modules/progress/service";
export const runtime = "nodejs";

export async function GET() {
  try { const user = await requiredUser(); return result({ achievements: await listAchievements(user.id) }); }
  catch (error) { return apiError(error); }
}
