import "server-only";
import { getPrisma } from "@/db/client";
import { localDateInTimezone } from "@/modules/habits/validation";
import { accessibleTask } from "@/modules/planning/service";
import { focusQuote } from "@/modules/xp/config";
import { appendXp, companionFromAvatar } from "@/modules/xp/service";
import { creditedSeconds, weekStart } from "./rules";

const db = () => getPrisma();

type Mode = "solo" | "squad";
const MODE = { solo: "SOLO", squad: "SQUAD" } as const;

async function verifiedTaskId(taskId: string | null | undefined, userId: string): Promise<string | null> {
  if (!taskId) return null;
  // Only link tasks the user may read; anything else is dropped rather than leaked.
  try {
    await accessibleTask(taskId, userId);
    return taskId;
  } catch {
    return null;
  }
}

/** Stamp the start on the server. Calling it again with the same key changes nothing. */
export async function startFocusSession(userId: string, input: { sessionKey: string; plannedMinutes: number; mode: Mode; taskId?: string | null }) {
  const existing = await db().focusSession.findUnique({
    where: { userId_clientKey: { userId, clientKey: input.sessionKey } },
    select: { id: true, startedAt: true },
  });
  if (existing) return { id: existing.id, startedAt: existing.startedAt };
  const taskId = await verifiedTaskId(input.taskId, userId);
  const created = await db().focusSession.upsert({
    where: { userId_clientKey: { userId, clientKey: input.sessionKey } },
    create: { userId, clientKey: input.sessionKey, plannedMinutes: input.plannedMinutes, mode: MODE[input.mode], taskId },
    update: {},
    select: { id: true, startedAt: true },
  });
  return created;
}

async function focusMinutesSince(userId: string, fromIso: string): Promise<number> {
  const sum = await db().focusSession.aggregate({
    where: { userId, endedAt: { gte: new Date(`${fromIso}T00:00:00.000Z`) } },
    _sum: { focusedSeconds: true },
  });
  return Math.round((sum._sum.focusedSeconds ?? 0) / 60);
}

async function userToday(userId: string): Promise<string> {
  const profile = await db().userProfile.findUnique({ where: { userId }, select: { timezone: true } });
  return localDateInTimezone(new Date(), profile?.timezone || "UTC");
}

export async function focusSummary(userId: string) {
  const today = await userToday(userId);
  const [weekFocusedMinutes, todayFocusedMinutes] = await Promise.all([
    focusMinutesSince(userId, weekStart(today)),
    focusMinutesSince(userId, today),
  ]);
  return { weekFocusedMinutes, todayFocusedMinutes };
}

/**
 * Finish a round. Retries with the same key return the first result and award nothing new.
 * A round the server never saw start is saved but earns no XP, because its length can't be checked.
 */
export async function finishFocusSession(userId: string, sessionKey: string, input: { focusedSeconds: number; plannedMinutes: number; mode: Mode; taskId?: string | null; stopReason?: string | null }) {
  const now = new Date();
  const taskId = await verifiedTaskId(input.taskId, userId);
  const outcome = await db().$transaction(async (tx) => {
    // Unknown key: the start never reached the server (for example offline), so it isn't verified.
    const session = await tx.focusSession.upsert({
      where: { userId_clientKey: { userId, clientKey: sessionKey } },
      create: { userId, clientKey: sessionKey, plannedMinutes: input.plannedMinutes, mode: MODE[input.mode], taskId, startedAt: now, verified: false },
      update: {},
      select: { id: true },
    });
    await tx.$queryRaw`SELECT id FROM "focus_session" WHERE id = ${session.id} FOR UPDATE`;
    const locked = await tx.focusSession.findUniqueOrThrow({ where: { id: session.id } });
    if (locked.endedAt) return { focusedSeconds: locked.focusedSeconds, xpAwarded: 0 };
    const focusedSeconds = locked.verified
      ? creditedSeconds({ claimed: input.focusedSeconds, plannedMinutes: Math.min(locked.plannedMinutes, input.plannedMinutes), startedAt: locked.startedAt, now })
      : Math.min(input.focusedSeconds, input.plannedMinutes * 60);
    const amount = locked.verified ? focusQuote(focusedSeconds) : 0;
    let xpAwarded = 0;
    if (amount > 0) {
      const growth = await appendXp(tx, userId, { source: "FOCUS", sourceId: locked.id, key: `focus:${locked.id}`, amount });
      xpAwarded = growth.xpAwarded;
    }
    await tx.focusSession.update({
      where: { id: locked.id },
      data: { endedAt: now, focusedSeconds, xpAwarded, stopReason: input.stopReason ?? null, taskId: locked.taskId ?? taskId },
    });
    return { focusedSeconds, xpAwarded };
  });
  const [summary, avatar] = await Promise.all([
    focusSummary(userId),
    db().avatar.findUnique({ where: { userId }, select: { stage: true, totalXp: true } }),
  ]);
  return {
    focusedSeconds: outcome.focusedSeconds,
    xpAwarded: outcome.xpAwarded,
    weekFocusedMinutes: summary.weekFocusedMinutes,
    companion: avatar ? companionFromAvatar(avatar) : null,
  };
}

export function quoteFocus(seconds: number): { xp: number } {
  return { xp: focusQuote(seconds) };
}
