import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { toggleCriterion } from "@/modules/goals/service";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string; milestoneId: string; criterionId: string }> };

export async function PATCH(_: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id, milestoneId, criterionId } = await context.params;
    return result({ goal: await toggleCriterion(user.id, safeId(id), safeId(milestoneId), safeId(criterionId)) });
  } catch (error) { return apiError(error); }
}
