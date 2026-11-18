import { cn } from "../lib/cn";

/** The sign-up path has six steps before the solo/squad branch. */
export const ONBOARDING_STEPS = ["Account", "Verify", "Your name", "Companion", "Privacy", "Solo or squad"] as const;

export interface OnboardingProgressProps {
  /** 1-based step number. */
  step: number;
  className?: string;
}

export function OnboardingProgress({ step, className }: OnboardingProgressProps) {
  const total = ONBOARDING_STEPS.length;
  const label = ONBOARDING_STEPS[step - 1] ?? "";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        role="progressbar"
        aria-label={`Step ${step} of ${total}: ${label}`}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        className="flex flex-1 gap-1.5"
      >
        {ONBOARDING_STEPS.map((name, index) => (
          <span
            key={name}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              index < step ? "bg-[image:var(--gradient-primary)]" : "bg-accent-tint",
            )}
          />
        ))}
      </div>
      <span className="ml-1 shrink-0 font-heading text-meta text-text-muted">
        {step} of {total}
      </span>
    </div>
  );
}
