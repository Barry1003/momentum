import "server-only";
import { getPrisma } from "@/db/client";
import { SquadError } from "@/modules/squads/policy";
import { RESERVED_HANDLES } from "./validation";

const db = () => getPrisma();

export const DEFAULTS = {
  handle: null as string | null,
  intention: "",
  shareCheckedIn: true,
  shareFocusStatus: true,
  shareFinishedSharedTasks: true,
  shareGrowthStage: true,
  shareStreaksAndXp: false,
  morningPlan: true,
  morningPlanTime: "08:30",
  eveningCheckIn: true,
  eveningCheckInTime: "21:00",
  habitReminders: true,
  squadCheers: false,
  reviewDay: true,
  quietEnabled: true,
  quietFrom: "22:00",
  quietTo: "08:00",
  quietDays: "everyDay",
  quietCustomDays: [] as number[],
};

/** A missing row means the defaults. Reading never creates one. */
export async function settingsOf(userId: string) {
  const row = await db().userSettings.findUnique({ where: { userId } });
  return row ?? { userId, ...DEFAULTS };
}

async function save(userId: string, data: Partial<typeof DEFAULTS>) {
  return db().userSettings.upsert({ where: { userId }, create: { userId, ...data }, update: data });
}

export async function getPrivacy(userId: string) {
  const s = await settingsOf(userId);
  return { shareCheckedIn: s.shareCheckedIn, shareFocusStatus: s.shareFocusStatus, shareFinishedSharedTasks: s.shareFinishedSharedTasks, shareGrowthStage: s.shareGrowthStage, shareStreaksAndXp: s.shareStreaksAndXp };
}
export async function savePrivacy(userId: string, input: Awaited<ReturnType<typeof getPrivacy>>) {
  await save(userId, input);
  return getPrivacy(userId);
}

export async function getReminders(userId: string) {
  const s = await settingsOf(userId);
  return { morningPlan: s.morningPlan, morningPlanTime: s.morningPlanTime, eveningCheckIn: s.eveningCheckIn, eveningCheckInTime: s.eveningCheckInTime, habitReminders: s.habitReminders, squadCheers: s.squadCheers, reviewDay: s.reviewDay };
}
export async function saveReminders(userId: string, input: Awaited<ReturnType<typeof getReminders>>) {
  await save(userId, input);
  return getReminders(userId);
}

export async function getQuietHours(userId: string) {
  const s = await settingsOf(userId);
  return { enabled: s.quietEnabled, from: s.quietFrom, to: s.quietTo, days: s.quietDays as "everyDay" | "weeknights" | "weekends" | "custom", customDays: s.quietCustomDays };
}
export async function saveQuietHours(userId: string, input: { enabled: boolean; from: string; to: string; days: string; customDays: number[] }) {
  const customDays = [...new Set(input.customDays)].sort((a, b) => a - b);
  await save(userId, { quietEnabled: input.enabled, quietFrom: input.from, quietTo: input.to, quietDays: input.days, quietCustomDays: customDays });
  return getQuietHours(userId);
}

/** A suggested handle from the display name, used until the person saves their own. */
export function suggestedHandle(displayName: string): string {
  const base = displayName.toLowerCase().replace(/[^a-z0-9_]+/g, "").slice(0, 15);
  return base.length >= 3 ? base : `${base}${"you".slice(0, 3 - base.length)}`;
}

export async function getProfileDetails(userId: string) {
  const s = await settingsOf(userId);
  if (s.handle) return { handle: s.handle, intention: s.intention };
  const profile = await db().userProfile.findUnique({ where: { userId }, select: { displayName: true } });
  return { handle: suggestedHandle(profile?.displayName ?? ""), intention: s.intention };
}

/** Handles are public and unique; the intention is only ever shown to its owner. */
export async function saveProfileDetails(userId: string, input: { handle: string; intention: string }) {
  if (RESERVED_HANDLES.has(input.handle)) throw new SquadError("HANDLE_TAKEN", 409, `@${input.handle} is taken. Try another.`);
  const owner = await db().userSettings.findUnique({ where: { handle: input.handle }, select: { userId: true } });
  if (owner && owner.userId !== userId) throw new SquadError("HANDLE_TAKEN", 409, `@${input.handle} is taken. Try another.`);
  try {
    await save(userId, { handle: input.handle, intention: input.intention });
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "P2002") throw new SquadError("HANDLE_TAKEN", 409, `@${input.handle} is taken. Try another.`);
    throw error;
  }
  return getProfileDetails(userId);
}
