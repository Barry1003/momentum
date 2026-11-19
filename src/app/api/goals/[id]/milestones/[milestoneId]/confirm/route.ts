import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { confirmMilestone } from "@/modules/goals/service";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string; milestoneId: string }> };

export async function POST(_: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id, milestoneId } = await context.params;
    return result(await confirmMilestone(user.id, safeId(id), safeId(milestoneId)));
  } catch (error) { return apiError(error); }
}
