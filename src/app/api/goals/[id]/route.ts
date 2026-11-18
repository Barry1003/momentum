import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import { updateGoalSchema } from "@/modules/planning/validation";
import { accessibleGoal, updateGoal, archiveGoal } from "@/modules/planning/service";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(_: Request, context: Ctx) {
  try {
    const user = await requiredUser(); const { id } = await context.params;
    return result({ goal: await accessibleGoal(safeId(id), user.id) });
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await requiredUser(); const { id } = await context.params;
    const input = await jsonBody(request, updateGoalSchema);
    return result({ goal: await updateGoal(safeId(id), user.id, input) });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_: Request, context: Ctx) {
  try {
    const user = await requiredUser(); const { id } = await context.params;
    return result(await archiveGoal(safeId(id), user.id));
  } catch (error) { return apiError(error); }
}
