import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { createHabitSchema } from "@/modules/habits/validation";
import { createHabit, listHabits } from "@/modules/habits/service";
export const runtime = "nodejs";
export async function GET() {
  try { const user = await requiredUser(); return result({ habits: await listHabits(user.id) }); }
  catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const input = await jsonBody(request, createHabitSchema);
    return result({ habit: await createHabit(user.id, input) }, 201);
  } catch (error) { return apiError(error); }
}
