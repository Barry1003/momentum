import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { submitSquadReport } from "@/modules/social/service";
import { reportSchema } from "@/modules/social/validation";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const input = await jsonBody(request, reportSchema);
    return result(await submitSquadReport(user.id, input), 201);
  } catch (error) { return apiError(error); }
}
