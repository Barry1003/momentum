import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { completeGoalTask } from "@/modules/goals/service";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string; taskId: string }> };

export async function POST(_: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id, taskId } = await context.params;
    return result(await completeGoalTask(user.id, safeId(id), safeId(taskId)));
  } catch (error) { return apiError(error); }
}
