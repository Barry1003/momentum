import "server-only";
import { getPrisma } from "@/db/client";
import type { XpSource } from "@/generated/prisma/client";
import { SquadError } from "@/modules/squads/policy";
import { permanentStage, nextThreshold, STAGES, type Stage } from "./config";

// Derived from the live (retry-extended) client, not Prisma.TransactionClient,
// since extending the client with $extends changes the shape $transaction's callback receives.
export type Tx = Parameters<Parameters<ReturnType<typeof getPrisma>["$transaction"]>[0]>[0];
export type Award = { source: XpSource; sourceId: string; key: string; amount: number };

const names = {
  CHILD: "child", PRETEEN: "preteen", TEEN: "teen",
  YOUNG_ADULT: "youngAdult", ADULT: "adult",
} as const;
const extras = {
  CHILD: "First room", PRETEEN: "Sunrise room", TEEN: "Sage room",
  YOUNG_ADULT: "Gold aura extra", ADULT: "Midnight room",
} as const;

/** Must be called within the same transaction as the authoritative activity. */
export async function appendXp(tx: Tx, userId: string, award: Award) {
  if (!Number.isSafeInteger(award.amount) || !Number.isSafeInteger(award.sourceId.length) ||
      award.sourceId.length < 1 || award.sourceId.length > 128 ||
      award.key.length < 1 || award.key.length > 250) {
    throw new SquadError("INVALID_XP_EVENT", 400, "Invalid reward event");
  }
  // Serialize all XP activity for a user, even across different source tables.
  const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM "avatar" WHERE "userId" = ${userId} FOR UPDATE`;
  if (locked.length !== 1) throw new SquadError("AVATAR_REQUIRED", 409, "Complete companion onboarding first");
  const existing = await tx.xpEvent.findUnique({
    where: { userId_idempotencyKey: { userId, idempotencyKey: award.key } },
    select: { amount: true, source: true, sourceId: true },
  });
  if (existing) {
    if (existing.amount !== award.amount || existing.source !== award.source || existing.sourceId !== award.sourceId)
      throw new SquadError("XP_EVENT_CONFLICT", 409, "Reward event already used");
    const avatar = await tx.avatar.findUniqueOrThrow({ where: { userId }, select: { totalXp: true, stage: true } });
    return { xpAwarded: 0, totalXp: avatar.totalXp, stage: avatar.stage as Stage, stageChanged: false };
  }
  // Ledger is the source of truth. This also heals a stale denormalized total.
  await tx.xpEvent.create({ data: {
    userId, source: award.source, sourceId: award.sourceId,
    idempotencyKey: award.key, amount: award.amount,
  } });
  const sum = await tx.xpEvent.aggregate({ where: { userId }, _sum: { amount: true } });
  const totalXp = Math.max(0, sum._sum.amount ?? 0);
  const avatar = await tx.avatar.findUniqueOrThrow({ where: { userId }, select: { stage: true } });
  const previous = avatar.stage as Stage;
  const stage = permanentStage(previous, totalXp);
  await tx.avatar.update({ where: { userId }, data: { totalXp, stage } });
  if (stage !== previous) {
    const oldIndex = STAGES.findIndex((item) => item.stage === previous);
    const newIndex = STAGES.findIndex((item) => item.stage === stage);
    for (const reached of STAGES.slice(oldIndex + 1, newIndex + 1)) {
      await tx.growthEvent.create({ data: { userId, kind: "STAGE_UP", stage: reached.stage, atXp: totalXp } });
    }
  }
  return { xpAwarded: award.amount, totalXp, stage, stageChanged: stage !== previous };
}

export function companionFromAvatar(avatar: { stage: string; totalXp: number }) {
  const stage = avatar.stage as Stage;
  return { stage: names[stage], xp: avatar.totalXp, xpToNextStage: nextThreshold(stage) };
}

export async function getPendingStageUp(userId: string) {
  const event = await getPrisma().growthEvent.findFirst({
    where: { userId, kind: "STAGE_UP", acknowledgedAt: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  if (!event || !event.stage) return null;
  const user = await getPrisma().user.findUnique({ where: { id: userId }, select: { createdAt: true } });
  const days = Math.max(1, Math.ceil((event.createdAt.getTime() - (user?.createdAt.getTime() ?? event.createdAt.getTime())) / 86400000));
  return {
    id: event.id, stage: names[event.stage], xp: event.atXp,
    days, extra: extras[event.stage],
  };
}

export async function acknowledgeStageUp(userId: string, id: string) {
  const changed = await getPrisma().growthEvent.updateMany({
    where: { id, userId, kind: "STAGE_UP", acknowledgedAt: null },
    data: { acknowledgedAt: new Date() },
  });
  if (!changed.count) throw new SquadError("NOT_FOUND", 404, "Growth event not found");
  return { acknowledged: true };
}

/** Achievement definitions and earning policies arrive in Area 3. Do not fabricate achievements. */
export async function getPendingAchievement(userId: string) {
  const event = await getPrisma().growthEvent.findFirst({
    where: { userId, kind: "ACHIEVEMENT", acknowledgedAt: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return event ? { id: event.id, achievementId: event.achievementId, atXp: event.atXp } : null;
}
