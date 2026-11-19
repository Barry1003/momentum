import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { SquadError } from "@/modules/squads/policy";
import { finishFocusSession } from "@/modules/focus/service";
import { finishFocusSchema, sessionKeySchema } from "@/modules/focus/validation";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ key: string }> };

export async function POST(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const key = sessionKeySchema.safeParse((await context.params).key);
    if (!key.success) throw new SquadError("NOT_FOUND", 404, "Not found");
    const input = await jsonBody(request, finishFocusSchema);
    return result(await finishFocusSession(user.id, key.data, input));
  } catch (error) { return apiError(error); }
}
