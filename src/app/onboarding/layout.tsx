import { OnboardingProvider } from "@/frontend/onboarding/OnboardingContext";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <main className="mx-auto min-h-screen w-full max-w-[420px] px-4 pt-6 pb-10 md:max-w-[480px] md:px-0 md:pt-16">
        {children}
      </main>
    </OnboardingProvider>
  );
}
