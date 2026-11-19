import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import { updateTaskSchema } from "@/modules/planning/validation";
import { accessibleTask, archiveTask, updateTask } from "@/modules/planning/service";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(_: Request, context: Ctx) {
  try {
    const user = await requiredUser(); const { id } = await context.params;
    return result({ task: await accessibleTask(safeId(id), user.id) });
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await requiredUser(); const { id } = await context.params;
    const input = await jsonBody(request, updateTaskSchema);
    return result({ task: await updateTask(safeId(id), user.id, input) });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_: Request, context: Ctx) {
  try {
    const user = await requiredUser(); const { id } = await context.params;
    return result(await archiveTask(safeId(id), user.id));
  } catch (error) { return apiError(error); }
}
