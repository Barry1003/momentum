import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import * as studio from "@/modules/growth/service";
import * as v from "@/modules/growth/validation";
export const runtime = "nodejs";
export async function GET() {
  try { const user = await requiredUser(); return result(await studio.getReview(user.id)); }
  catch (error) { return apiError(error); }
}
export async function PUT(request: Request) {
  try {
    const user = await requiredUser();
    const input = await jsonBody(request, v.reviewSchema);
    return result(await studio.saveReview(user.id, input));
  } catch (error) { return apiError(error); }
}
