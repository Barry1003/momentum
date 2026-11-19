import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import { completeTaskSchema } from "@/modules/planning/validation";
import { completeTask, reopenTask } from "@/modules/planning/service";
import { SquadError } from "@/modules/squads/policy";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Ctx) {
  try {
    const user = await requiredUser(); const { id } = await context.params;
    const { occurrenceDate } = await jsonBody(request, completeTaskSchema);
    return result(await completeTask(safeId(id), user.id, occurrenceDate));
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request, context: Ctx) {
  try {
    const user = await requiredUser(); const { id } = await context.params;
    const occurrenceDate = new URL(request.url).searchParams.get("occurrenceDate");
    const parsed = completeTaskSchema.safeParse({ occurrenceDate });
    if (!parsed.success) throw new SquadError("INVALID_INPUT", 400, "Invalid occurrence date");
    return result(await reopenTask(safeId(id), user.id, parsed.data.occurrenceDate));
  } catch (error) { return apiError(error); }
}
