import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import { createInvitation, listInvitations } from "@/modules/squads/service";
import { invitationSchema } from "@/modules/squads/validation";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };
export async function GET(_: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id } = await context.params;
    return result({ invitations: await listInvitations(safeId(id), user.id) });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id } = await context.params;
    const input = await jsonBody(request, invitationSchema);
    return result({ invitation: await createInvitation(safeId(id), user.id, input) }, 201);
  } catch (error) { return apiError(error); }
}
