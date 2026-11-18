import { z } from "zod";

export const onboardingPatchSchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("name"),
    displayName: z.string().trim().min(2).max(24),
  }).strict(),
  z.object({
    step: z.literal("companion"),
    companionName: z.string().trim().min(1).max(20),
    companionStyle: z.enum(["anime", "soft3d"]),
    companionLook: z.enum(["boy", "girl"]),
  }).strict(),
  z.object({
    step: z.literal("path"),
    path: z.enum(["solo", "squad"]),
  }).strict(),
]);

export type OnboardingPatch = z.infer<typeof onboardingPatchSchema>;

export function nextOnboardingDestination(value: {
  complete: boolean;
  profile: { onboardingStep: string } | null;
  avatar: { name: string } | null;
  hasSquad: boolean;
  path: "solo" | "squad";
}): string {
  if (value.complete) return value.hasSquad ? "/home?tab=squad" : "/home";
  if (!value.profile) return "/onboarding/name";
  if (!value.avatar) return "/onboarding/companion";
  if (value.profile.onboardingStep === "PATH") {
    return value.path === "squad" && !value.hasSquad ? "/onboarding/join" : "/onboarding/ready";
  }
  return "/onboarding/privacy";
}
