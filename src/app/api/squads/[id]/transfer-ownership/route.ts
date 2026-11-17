import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import { transferOwnership } from "@/modules/squads/service";
import { transferSchema } from "@/modules/squads/validation";
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requiredUser();
    const { id } = await params;
    const { userId } = await jsonBody(request, transferSchema);
    return result(await transferOwnership(safeId(id), user.id, safeId(userId)));
  } catch (error) { return apiError(error); }
}
