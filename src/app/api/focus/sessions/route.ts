import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { startFocusSession } from "@/modules/focus/service";
import { startFocusSchema } from "@/modules/focus/validation";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const input = await jsonBody(request, startFocusSchema);
    return result({ session: await startFocusSession(user.id, input) }, 201);
  } catch (error) { return apiError(error); }
}
