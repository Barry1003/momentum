import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import { habitDate, logHabitSchema } from "@/modules/habits/validation";
import { clearHabitLog, logHabit } from "@/modules/habits/service";
import { SquadError } from "@/modules/squads/policy";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string; date: string }> };
function validDate(date: string) {
  const parsed = habitDate.safeParse(date);
  if (!parsed.success) throw new SquadError("INVALID_DATE", 400, "Invalid date");
  return parsed.data;
}
export async function PUT(request: Request, context: Ctx) {
  try {
    const user = await requiredUser(); const { id, date } = await context.params;
    const { value } = await jsonBody(request, logHabitSchema);
    return result(await logHabit(safeId(id), user.id, validDate(date), value));
  } catch (error) { return apiError(error); }
}
export async function DELETE(_: Request, context: Ctx) {
  try {
    const user = await requiredUser(); const { id, date } = await context.params;
    return result(await clearHabitLog(safeId(id), user.id, validDate(date)));
  } catch (error) { return apiError(error); }
}
