import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { createTaskSchema } from "@/modules/planning/validation";
import { createTask, listTasks } from "@/modules/planning/service";
export const runtime = "nodejs";
export async function GET() {
  try {
    const user = await requiredUser();
    return result({ tasks: await listTasks(user.id) });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const input = await jsonBody(request, createTaskSchema);
    return result({ task: await createTask(user.id, input) }, 201);
  } catch (error) { return apiError(error); }
}
