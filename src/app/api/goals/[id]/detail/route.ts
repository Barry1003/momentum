import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { getGoalDetail } from "@/modules/goals/service";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id } = await context.params;
    return result({ goal: await getGoalDetail(user.id, safeId(id)) });
  } catch (error) { return apiError(error); }
}
