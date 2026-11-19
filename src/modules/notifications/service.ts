import "server-only";
import { getPrisma } from "@/db/client";
import { localDateInTimezone } from "@/modules/habits/validation";
import { shape, type RawNotification } from "./format";

const db = () => getPrisma();
const DAY_MS = 24 * 60 * 60 * 1000;
const STAGE_NAME: Record<string, string> = { CHILD: "a Child", PRETEEN: "a Preteen", TEEN: "a Teen", YOUNG_ADULT: "a Young Adult", ADULT: "an Adult" };
const nameOf = (user: { name: string; profile: { displayName: string } | null }) => user.profile?.displayName || user.name;

/**
 * Built from what happened, not stored twice: cheers to you (minus muted people),
 * your own growth moments, your reports, and new squadmates. Last 30 days.
 */
export async function getNotifications(userId: string) {
  const since = new Date(Date.now() - 30 * DAY_MS);
  const [profile, cursor, mutes, cheers, growth, reports, squads] = await Promise.all([
    db().userProfile.findUnique({ where: { userId }, select: { timezone: true } }),
    db().notificationCursor.findUnique({ where: { userId }, select: { readAt: true } }),
    db().squadMute.findMany({ where: { userId }, select: { mutedUserId: true } }),
    db().cheer.findMany({ where: { toUserId: userId, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, message: true, createdAt: true, fromUserId: true, from: { select: { name: true, profile: { select: { displayName: true } } } } } }),
    db().growthEvent.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, kind: true, stage: true, achievementId: true, atXp: true, createdAt: true } }),
    db().squadReport.findMany({ where: { reporterId: userId, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, status: true, createdAt: true } }),
    db().squadMember.findMany({ where: { userId, status: "ACTIVE", squad: { status: "ACTIVE" } }, select: { squadId: true, joinedAt: true, squad: { select: { name: true } } } }),
  ]);
  const muted = new Set(mutes.map((row) => row.mutedUserId));
  const joins = squads.length
    ? await db().squadMember.findMany({
        where: { squadId: { in: squads.map((row) => row.squadId) }, status: "ACTIVE", userId: { not: userId }, joinedAt: { gte: since } },
        orderBy: { joinedAt: "desc" },
        take: 20,
        select: { id: true, squadId: true, joinedAt: true, userId: true, user: { select: { name: true, profile: { select: { displayName: true } } } } },
      })
    : [];
  const squadName = new Map(squads.map((row) => [row.squadId, row.squad.name]));
  const myJoin = new Map(squads.map((row) => [row.squadId, row.joinedAt]));

  const items: RawNotification[] = [
    ...cheers.filter((cheer) => !muted.has(cheer.fromUserId)).map((cheer) => ({
      id: `cheer:${cheer.id}`,
      at: cheer.createdAt,
      kind: "cheer" as const,
      fromName: nameOf(cheer.from),
      title: cheer.message === "Wave" ? `${nameOf(cheer.from)} waved at you` : `${nameOf(cheer.from)} sent you a ${cheer.message.toLowerCase()}`,
      body: cheer.message === "Wave" ? "Say hi back from your squad room." : `“${cheer.message}!”`,
    })),
    ...growth.map((event) => ({
      id: `growth:${event.id}`,
      at: event.createdAt,
      kind: "growth" as const,
      title: event.kind === "STAGE_UP" ? `Ari became ${STAGE_NAME[event.stage ?? "CHILD"]}` : `You earned “${(event.achievementId ?? "an achievement").replace(/-/g, " ")}”`,
      body: event.kind === "STAGE_UP" ? `At ${event.atXp} XP. It’s yours to keep.` : "Open Me to see it.",
    })),
    ...reports.map((report) => ({
      id: `report:${report.id}`,
      at: report.createdAt,
      kind: "review" as const,
      title: report.status === "OPEN" ? "We got your report" : "Your report was reviewed",
      body: report.status === "OPEN" ? "We’ll look at it within 24 hours. Nobody was told who reported." : "Thanks for helping keep squads kind.",
    })),
    // Only people who joined after you did, so your own join doesn't flood you.
    ...joins.filter((join) => !muted.has(join.userId) && join.joinedAt > (myJoin.get(join.squadId) ?? new Date(0))).map((join) => ({
      id: `join:${join.id}`,
      at: join.joinedAt,
      kind: "squad" as const,
      fromName: nameOf(join.user),
      title: `${nameOf(join.user)} joined ${squadName.get(join.squadId) ?? "your squad"}`,
      body: "Say hi with a wave.",
    })),
  ];
  const now = new Date();
  return shape(items, cursor?.readAt ?? null, now, localDateInTimezone(now, profile?.timezone || "UTC"));
}

export async function markAllNotificationsRead(userId: string) {
  const readAt = new Date();
  await db().notificationCursor.upsert({ where: { userId }, create: { userId, readAt }, update: { readAt } });
  return getNotifications(userId);
}
