import { apiError, requiredUser, result } from "@/modules/squads/http";
import { leaveSharedGoal } from "@/modules/social/service";
export const runtime = "nodejs";

export async function POST() {
  try { const user = await requiredUser(); return result({ goal: await leaveSharedGoal(user.id) }); }
  catch (error) { return apiError(error); }
}
