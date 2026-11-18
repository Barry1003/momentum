import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import { changeHabitPause } from "@/modules/habits/service";
import { z } from "zod";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await requiredUser(); const { id } = await params; return result({ habit: await changeHabitPause(safeId(id), user.id, true, (await jsonBody(request, z.object({ weeks: z.number().int().min(1).max(52).nullable() }).strict())).weeks) }); }
  catch (error) { return apiError(error); }
}
