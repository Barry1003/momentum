import { apiError, requiredUser, result } from "@/modules/squads/http";
import { getSharedGoal } from "@/modules/social/service";
export const runtime = "nodejs";

export async function GET() {
  try { const user = await requiredUser(); return result({ goal: await getSharedGoal(user.id) }); }
  catch (error) { return apiError(error); }
}
