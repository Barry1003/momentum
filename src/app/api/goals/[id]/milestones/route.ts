import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import { addMilestone } from "@/modules/goals/service";
import { milestoneSchema } from "@/modules/goals/validation";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id } = await context.params;
    const input = await jsonBody(request, milestoneSchema);
    return result({ goal: await addMilestone(user.id, safeId(id), input) }, 201);
  } catch (error) { return apiError(error); }
}
