import { apiError, requiredUser, result } from "@/modules/squads/http";
import { sendDeletionCode } from "@/modules/account/service";
export const runtime = "nodejs";

export async function POST() {
  try { const user = await requiredUser(); return result(await sendDeletionCode(user.id)); }
  catch (error) { return apiError(error); }
}
