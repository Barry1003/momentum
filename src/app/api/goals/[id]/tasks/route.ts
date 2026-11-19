import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import { addGoalTask } from "@/modules/goals/service";
import { goalTaskSchema } from "@/modules/goals/validation";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id } = await context.params;
    const input = await jsonBody(request, goalTaskSchema);
    return result({ goal: await addGoalTask(user.id, safeId(id), input) }, 201);
  } catch (error) { return apiError(error); }
}
