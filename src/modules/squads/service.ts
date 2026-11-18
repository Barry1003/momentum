import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getPrisma } from "@/db/client";
import { canManageMember, canManageSquad, mayJoin, mayLeave, SquadError, type SquadRole } from "./policy";
import type { z } from "zod";
import type { createSquadSchema, invitationSchema, updateSquadSchema } from "./validation";

type NewSquad = z.infer<typeof createSquadSchema>;
type UpdateSquad = z.infer<typeof updateSquadSchema>;
type NewInvitation = z.infer<typeof invitationSchema>;

const db = () => getPrisma();
const invalid = () => new SquadError("NOT_FOUND", 404, "Squad or member not found");
const hashCode = (code: string) => createHash("sha256").update(code).digest("hex");
const now = () => new Date();

function toSquadData(squad: { id: string; name: string; description: string | null; maxMembers: number; status: string; ownerId: string; createdAt: Date; members: { userId: string; role: string }[] }) {
  return {
    id: squad.id, name: squad.name, description: squad.description,
    maxMembers: squad.maxMembers, status: squad.status, ownerId: squad.ownerId,
    memberCount: squad.members.length, createdAt: squad.createdAt,
  };
}

export async function createSquad(userId: string, input: NewSquad) {
  const squad = await db().$transaction(async tx => {
    const created = await tx.squad.create({
      data: { name: input.name, description: input.description, maxMembers: input.maxMembers, ownerId: userId },
    });
    await tx.squadMember.create({
      data: { squadId: created.id, userId, role: "OWNER", status: "ACTIVE" },
    });
    return created;
  });
  return { id: squad.id, name: squad.name, ownerId: squad.ownerId, maxMembers: squad.maxMembers, memberCount: 1 };
}

export async function listMySquads(userId: string) {
  const items = await db().squad.findMany({
    where: { status: "ACTIVE", members: { some: { userId, status: "ACTIVE" } } },
    include: { members: { where: { status: "ACTIVE" }, select: { userId: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return items.map(toSquadData);
}

export async function activeMember(squadId: string, userId: string) {
  const membership = await db().squadMember.findUnique({
    where: { squadId_userId: { squadId, userId } },
    select: { role: true, status: true },
  });
  if (!membership || membership.status !== "ACTIVE") throw invalid();
  return membership.role as SquadRole;
}

async function manager(squadId: string, userId: string): Promise<SquadRole> {
  const role = await activeMember(squadId, userId);
  if (!canManageSquad(role)) throw new SquadError("FORBIDDEN", 403, "Insufficient squad permissions");
  return role;
}

export async function getSquad(squadId: string, userId: string) {
  await activeMember(squadId, userId);
  const squad = await db().squad.findUnique({
    where: { id: squadId },
    include: { members: { where: { status: "ACTIVE" }, select: { userId: true, role: true } } },
  });
  if (!squad || squad.status !== "ACTIVE") throw invalid();
  return toSquadData(squad);
}

export async function updateSquad(squadId: string, userId: string, input: UpdateSquad) {
  await manager(squadId, userId);
  const squad = await db().squad.update({
    where: { id: squadId, status: "ACTIVE" },
    data: input,
    select: { id: true, name: true, description: true, maxMembers: true },
  });
  return squad;
}

export async function listMembers(squadId: string, userId: string) {
  await activeMember(squadId, userId);
  return db().squadMember.findMany({
    where: { squadId, status: "ACTIVE" },
    select: { userId: true, role: true, joinedAt: true, user: { select: { name: true, image: true, profile: { select: { displayName: true } } } } },
    orderBy: { joinedAt: "asc" },
    take: 10,
  });
}

export async function createInvitation(squadId: string, userId: string, input: NewInvitation) {
  await manager(squadId, userId);
  const code = randomBytes(32).toString("base64url");
  const invitation = await db().squadInvitation.create({
    data: {
      squadId, createdById: userId, codeHash: hashCode(code), email: input.email,
      expiresAt: new Date(Date.now() + input.expiresHours * 60 * 60 * 1000),
      maxUses: input.maxUses,
    },
    select: { id: true, expiresAt: true, maxUses: true },
  });
  // Raw invitation code is returned ONCE; only the SHA-256 digest is stored.
  return { ...invitation, code };
}

export async function listInvitations(squadId: string, userId: string) {
  await manager(squadId, userId);
  return db().squadInvitation.findMany({
    where: { squadId },
    select: { id: true, email: true, status: true, uses: true, maxUses: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function closeInvitation(invitationId: string, userId: string) {
  const invitation = await db().squadInvitation.findUnique({ where: { id: invitationId } });
  if (!invitation) throw invalid();
  await manager(invitation.squadId, userId);
  await db().squadInvitation.update({ where: { id: invitationId }, data: { status: "CLOSED" } });
  return { closed: true };
}

export async function previewInvitation(code: string) {
  if (code.length < 20 || code.length > 256) throw invalid();
  const invitation = await db().squadInvitation.findUnique({
    where: { codeHash: hashCode(code) },
    include: { squad: { include: { members: { where: { status: "ACTIVE" }, select: { userId: true } } } } },
  });
  if (!invitation) throw invalid();
  const activeMembers = invitation.squad.members.length;
  return {
    squadName: invitation.squad.name,
    memberCount: activeMembers,
    full: activeMembers >= invitation.squad.maxMembers,
    available: invitation.status === "OPEN" && invitation.expiresAt > now() &&
      invitation.uses < invitation.maxUses && activeMembers < invitation.squad.maxMembers &&
      invitation.squad.status === "ACTIVE",
  };
}

export async function acceptInvitation(code: string, userId: string, email: string) {
  if (code.length < 20 || code.length > 256) throw invalid();
  return db().$transaction(async tx => {
    const invitation = await tx.squadInvitation.findUnique({ where: { codeHash: hashCode(code) } });
    if (!invitation) throw invalid();

    // Serialize joins for this squad: two concurrent invites cannot oversubscribe capacity.
    await tx.$queryRaw`SELECT id FROM "squad" WHERE id = ${invitation.squadId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "squad_invitation" WHERE id = ${invitation.id} FOR UPDATE`;
    const squad = await tx.squad.findUnique({ where: { id: invitation.squadId } });
    const fresh = await tx.squadInvitation.findUnique({ where: { id: invitation.id } });
    if (!squad || !fresh || squad.status !== "ACTIVE") throw invalid();

    const existing = await tx.squadMember.findUnique({
      where: { squadId_userId: { squadId: squad.id, userId } },
    });
    if (existing?.status === "ACTIVE") return { squadId: squad.id, joined: false };

    if (fresh.status !== "OPEN" || fresh.expiresAt <= now()) {
      throw new SquadError("INVITATION_CLOSED", 410, "Invitation is no longer available");
    }
    if (fresh.email && fresh.email.toLowerCase() !== email.toLowerCase()) {
      throw new SquadError("INVITATION_RESTRICTED", 403, "Invitation is for a different account");
    }
    const count = await tx.squadMember.count({ where: { squadId: squad.id, status: "ACTIVE" } });
    const reject = mayJoin(fresh.uses, fresh.maxUses, count, squad.maxMembers);
    if (reject) throw new SquadError(reject, 409, "Unable to join this squad");
    await tx.squadMember.upsert({
      where: { squadId_userId: { squadId: squad.id, userId } },
      create: { squadId: squad.id, userId, status: "ACTIVE", role: "MEMBER" },
      update: { status: "ACTIVE", role: "MEMBER", leftAt: null, joinedAt: now() },
    });
    await tx.squadInvitation.update({
      where: { id: fresh.id }, data: { uses: { increment: 1 } },
    });
    return { squadId: squad.id, joined: true };
  });
}

export async function changeMemberRole(squadId: string, actorId: string, targetId: string, role: "ADMIN" | "MEMBER") {
  return db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "squad" WHERE id = ${squadId} FOR UPDATE`;
    const actor = await tx.squadMember.findUnique({ where: { squadId_userId: { squadId, userId: actorId } } });
    const target = await tx.squadMember.findUnique({ where: { squadId_userId: { squadId, userId: targetId } } });
    if (!actor || !target || actor.status !== "ACTIVE" || target.status !== "ACTIVE") throw invalid();
    if (!canManageMember(actor.role, target.role)) throw new SquadError("FORBIDDEN", 403, "Cannot change this role");
    await tx.squadMember.update({ where: { id: target.id }, data: { role } });
    return { userId: targetId, role };
  });
}

export async function removeMember(squadId: string, actorId: string, targetId: string) {
  return db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "squad" WHERE id = ${squadId} FOR UPDATE`;
    const actor = await tx.squadMember.findUnique({ where: { squadId_userId: { squadId, userId: actorId } } });
    const target = await tx.squadMember.findUnique({ where: { squadId_userId: { squadId, userId: targetId } } });
    if (!actor || !target || actor.status !== "ACTIVE" || target.status !== "ACTIVE") throw invalid();
    if (!canManageMember(actor.role, target.role)) throw new SquadError("FORBIDDEN", 403, "Cannot remove this member");
    await tx.squadMember.update({ where: { id: target.id }, data: { status: "REMOVED", leftAt: now() } });
    return { removed: true };
  });
}

export async function leaveSquad(squadId: string, userId: string) {
  return db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "squad" WHERE id = ${squadId} FOR UPDATE`;
    const membership = await tx.squadMember.findUnique({ where: { squadId_userId: { squadId, userId } } });
    if (!membership || membership.status !== "ACTIVE") throw invalid();
    if (!mayLeave(membership.role)) {
      throw new SquadError("OWNER_TRANSFER_REQUIRED", 409, "Transfer ownership before leaving");
    }
    await tx.squadMember.update({ where: { id: membership.id }, data: { status: "LEFT", leftAt: now() } });
    return { left: true };
  });
}

export async function transferOwnership(squadId: string, ownerId: string, successorId: string) {
  return db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "squad" WHERE id = ${squadId} FOR UPDATE`;
    const squad = await tx.squad.findUnique({ where: { id: squadId } });
    if (!squad || squad.status !== "ACTIVE" || squad.ownerId !== ownerId) {
      throw new SquadError("FORBIDDEN", 403, "Only the current owner may transfer ownership");
    }
    if (ownerId === successorId) throw new SquadError("INVALID_INPUT", 400, "Choose another member");
    const successor = await tx.squadMember.findUnique({ where: { squadId_userId: { squadId, userId: successorId } } });
    if (!successor || successor.status !== "ACTIVE") throw invalid();
    await tx.squad.update({ where: { id: squadId }, data: { ownerId: successorId } });
    await tx.squadMember.update({ where: { id: successor.id }, data: { role: "OWNER" } });
    await tx.squadMember.update({
      where: { squadId_userId: { squadId, userId: ownerId } }, data: { role: "ADMIN" },
    });
    return { ownerId: successorId };
  });
}
