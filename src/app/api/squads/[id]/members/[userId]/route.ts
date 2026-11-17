import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import { changeMemberRole, removeMember } from "@/modules/squads/service";
import { memberRoleSchema } from "@/modules/squads/validation";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; userId: string }> };
export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id, userId } = await context.params;
    const { role } = await jsonBody(request, memberRoleSchema);
    return result({ member: await changeMemberRole(safeId(id), user.id, safeId(userId), role) });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id, userId } = await context.params;
    return result(await removeMember(safeId(id), user.id, safeId(userId)));
  } catch (error) { return apiError(error); }
}
