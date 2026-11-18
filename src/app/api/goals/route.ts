import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { createGoalSchema } from "@/modules/planning/validation";
import { createGoal, listGoals } from "@/modules/planning/service";
export const runtime = "nodejs";
export async function GET() {
  try {
    const user = await requiredUser();
    return result({ goals: await listGoals(user.id) });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const input = await jsonBody(request, createGoalSchema);
    return result({ goal: await createGoal(user.id, input) }, 201);
  } catch (error) { return apiError(error); }
}
