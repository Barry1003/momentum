import "server-only";
import { getPrisma } from "@/db/client";
import { SquadError } from "@/modules/squads/policy";
import type { OnboardingPatch } from "./contract";
import { nextOnboardingDestination } from "./contract";

const db = () => getPrisma();

export async function getOnboardingState(userId: string) {
  const [profile, avatar, squads] = await Promise.all([
    db().userProfile.findUnique({ where: { userId } }),
    db().avatar.findUnique({ where: { userId } }),
    db().squadMember.findMany({
      where: { userId, status: "ACTIVE", squad: { status: "ACTIVE" } },
      select: { squadId: true, squad: { select: { name: true } } },
      take: 10,
    }),
  ]);
  const path = profile?.homePreference === "SQUAD_ROOM" ? "squad" : "solo";
  const complete = Boolean(profile?.onboardingComplete && avatar);
  const hasSquad = squads.length > 0;
  return {
    profile: profile ? { displayName: profile.displayName, timezone: profile.timezone, onboardingStep: profile.onboardingStep } : null,
    avatar: avatar ? { name: avatar.name, artStyle: avatar.artStyle, bodyForm: avatar.bodyForm, stage: avatar.stage, totalXp: avatar.totalXp } : null,
    path, complete, hasSquad,
    squads: squads.map(item => ({ id: item.squadId, name: item.squad.name })),
    destination: nextOnboardingDestination({
      complete, profile, avatar, hasSquad, path,
    }),
  };
}

export async function patchOnboarding(userId: string, step: OnboardingPatch) {
  if (step.step === "name") {
    await db().userProfile.upsert({
      where: { userId },
      create: { userId, displayName: step.displayName, onboardingStep: "NAME" },
      update: { displayName: step.displayName },
    });
  } else if (step.step === "companion") {
    const profile = await db().userProfile.findUnique({ where: { userId }, select: { userId: true } });
    if (!profile) throw new SquadError("STEP_REQUIRED", 409, "Save your display name first");
    await db().$transaction(async tx => {
      await tx.avatar.upsert({
        where: { userId },
        create: {
          userId, name: step.companionName,
          artStyle: step.companionStyle === "anime" ? "ANIME" : "SOFT_3D",
          bodyForm: step.companionLook === "boy" ? "BOY" : "GIRL",
        },
        update: {
          name: step.companionName,
          artStyle: step.companionStyle === "anime" ? "ANIME" : "SOFT_3D",
          bodyForm: step.companionLook === "boy" ? "BOY" : "GIRL",
        },
      });
      await tx.userProfile.update({ where: { userId }, data: { onboardingStep: "COMPANION" } });
    });
  } else {
    const avatar = await db().avatar.findUnique({ where: { userId }, select: { id: true } });
    if (!avatar) throw new SquadError("STEP_REQUIRED", 409, "Choose your companion first");
    await db().userProfile.update({
      where: { userId },
      data: { homePreference: step.path === "squad" ? "SQUAD_ROOM" : "MY_SPACE", onboardingStep: "PATH" },
    });
  }
  return getOnboardingState(userId);
}

export async function finishOnboarding(userId: string) {
  const state = await getOnboardingState(userId);
  if (!state.profile || !state.avatar || state.profile.onboardingStep !== "PATH") {
    throw new SquadError("ONBOARDING_INCOMPLETE", 409, "Complete your profile, companion, and path first");
  }
  if (state.path === "squad" && !state.hasSquad) {
    throw new SquadError("SQUAD_REQUIRED", 409, "Join or create a squad, or choose solo to finish");
  }
  await db().userProfile.update({
    where: { userId },
    data: { onboardingComplete: true, onboardingStep: "COMPLETE" },
  });
  return getOnboardingState(userId);
}
