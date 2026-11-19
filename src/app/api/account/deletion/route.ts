import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { cancelAccountDeletion, requestAccountDeletion } from "@/modules/account/service";
import { deletionSchema } from "@/modules/account/validation";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const { code } = await jsonBody(request, deletionSchema);
    return result(await requestAccountDeletion(user.id, code));
  } catch (error) { return apiError(error); }
}
export async function DELETE() {
  try { const user = await requiredUser(); return result(await cancelAccountDeletion(user.id)); }
  catch (error) { return apiError(error); }
}
