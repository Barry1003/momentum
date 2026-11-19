import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { changeHabitPause } from "@/modules/habits/service";
export const runtime = "nodejs";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await requiredUser(); const { id } = await params; return result({ habit: await changeHabitPause(safeId(id), user.id, false) }); }
  catch (error) { return apiError(error); }
}
