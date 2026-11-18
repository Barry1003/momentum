import { OnboardingProvider } from "@/frontend/onboarding/OnboardingContext";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  // Each screen picks its own frame: full-bleed scenes (welcome, sign in,
  // sign up) or the centered StepShell column for the setup steps.
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
