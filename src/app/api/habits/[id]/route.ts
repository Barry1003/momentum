import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import { updateHabitSchema } from "@/modules/habits/validation";
import { archiveHabit, getHabit, updateHabit } from "@/modules/habits/service";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(_: Request, context: Ctx) {
  try { const user = await requiredUser(); const { id } = await context.params; return result({ habit: await getHabit(safeId(id), user.id) }); }
  catch (error) { return apiError(error); }
}
export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await requiredUser(); const { id } = await context.params;
    const input = await jsonBody(request, updateHabitSchema);
    return result({ habit: await updateHabit(safeId(id), user.id, input) });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_: Request, context: Ctx) {
  try { const user = await requiredUser(); const { id } = await context.params; return result(await archiveHabit(safeId(id), user.id)); }
  catch (error) { return apiError(error); }
}
