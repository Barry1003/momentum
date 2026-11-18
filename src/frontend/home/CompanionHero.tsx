"use client";

import { Companion, GreetingBubble, type CompanionReaction, type GrowthStage } from "../companion";
import { cn } from "../lib/cn";
import { GROWTH_STAGES, growthBarPosition, nextStageLabel, stageIndex, stageLabel } from "./growth";
import { SparkleIcon } from "./icons";

export interface CompanionHeroProps {
  stage: GrowthStage;
  xp: number;
  xpToNextStage: number | null;
  message: string;
  reaction: CompanionReaction;
  onTap: () => void;
  onReactionEnd: () => void;
  /** Desktop shows a taller card with a heading and stage names under the bar. */
  variant?: "mobile" | "desktop";
  className?: string;
}

function Orb({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "animate-cloud-drift pointer-events-none absolute rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#b9a3f0_55%,#7b57d6)] shadow-[0_6px_14px_rgba(107,70,201,.35)]",
        className,
      )}
    />
  );
}

/** The companion "stage": Ari on a glowing plinth, a speech bubble, and the XP growth bar. */
export function CompanionHero({
  stage,
  xp,
  xpToNextStage,
  message,
  reaction,
  onTap,
  onReactionEnd,
  variant = "mobile",
  className,
}: CompanionHeroProps) {
  const index = stageIndex(stage);
  const next = nextStageLabel(stage);
  const position = growthBarPosition(stage, xp, xpToNextStage);
  const isDesktop = variant === "desktop";

  return (
    <section
      aria-label="Your companion"
      className={cn(
        "relative overflow-hidden rounded-[32px] bg-[linear-gradient(160deg,#f9f2e5_0%,#f6eee4_55%,#fbe6dc_100%)] p-4 shadow-floating",
        isDesktop ? "flex min-h-[860px] flex-col p-6" : "",
        className,
      )}
    >
      <span aria-hidden className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[#d9ccf6]/60 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-[#ffd9c4]/60 blur-2xl" />

      {isDesktop ? (
        <div className="relative mb-3">
          <p className="font-heading text-meta font-bold tracking-wide text-accent uppercase">Small steps. Real growth.</p>
          <p className="mt-1 font-display text-title font-extrabold text-text">
            A little focus,
            <br />a little further.
          </p>
        </div>
      ) : null}

      <span className="relative inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 font-heading text-meta font-bold text-accent-strong shadow-raised">
        <SparkleIcon className="h-3.5 w-3.5" />
        {isDesktop ? `Ari · ${stageLabel(stage)} · Stage ${index + 1} of 5` : `${stageLabel(stage)} · Stage ${index + 1} of 5`}
      </span>

      <div className={cn("relative flex items-end justify-center", isDesktop ? "flex-1 pt-6" : "h-[300px]")}>
        <Orb className="top-14 left-6 h-6 w-6" />
        <Orb className="top-32 left-12 h-2.5 w-2.5 [animation-delay:-3s]" />
        <Orb className="right-8 bottom-24 h-3.5 w-3.5 [animation-delay:-5s]" />
        <GreetingBubble visible className={cn("absolute z-10 max-w-[150px]", isDesktop ? "top-[34%] right-6" : "top-10 right-0")}>
          {message}
        </GreetingBubble>
        <span
          aria-hidden
          className="absolute bottom-1 h-14 w-56 rounded-[50%] bg-[linear-gradient(180deg,#fbf6ee,#e9e0f7)] shadow-[0_10px_0_#b9a3f0,0_18px_30px_rgba(107,70,201,.3)]"
        />
        <Companion
          stage={stage}
          reaction={reaction}
          look={{ room: "lavender", outfit: "original" }}
          size="hero"
          onTap={onTap}
          onReactionEnd={onReactionEnd}
          followPointer
          className={cn("relative mb-5", isDesktop ? "[&_img]:h-[420px]" : "")}
        />
      </div>

      <div className="relative mt-3 rounded-[24px] bg-surface/90 px-4 py-3 shadow-raised">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-heading text-label font-bold text-text">
            {xp.toLocaleString("en-GB")}
            {xpToNextStage ? ` / ${xpToNextStage.toLocaleString("en-GB")} XP` : " XP"}
          </p>
          {next && xpToNextStage ? (
            <p className="font-heading text-meta text-text-muted">
              {(xpToNextStage - xp).toLocaleString("en-GB")} to {next}
            </p>
          ) : null}
        </div>
        <div
          role="progressbar"
          aria-label="Growth toward the next stage"
          aria-valuemin={0}
          aria-valuemax={xpToNextStage ?? xp}
          aria-valuenow={xp}
          className="relative mt-3 h-3"
        >
          <span className="absolute inset-x-1 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent-tint shadow-inset" />
          <span
            className="absolute top-1/2 left-1 h-1.5 -translate-y-1/2 rounded-full bg-[image:var(--gradient-primary)]"
            style={{ width: `calc(${position * 100}% - 8px)` }}
          />
          {GROWTH_STAGES.map((item, dot) => (
            <span
              key={item.stage}
              className={cn(
                "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
                dot <= index ? "border-white bg-accent shadow-pressable" : "border-outline bg-surface",
              )}
              style={{ left: `calc(${(dot / (GROWTH_STAGES.length - 1)) * 100}% * 0.96 + 2%)` }}
            />
          ))}
        </div>
        {isDesktop ? (
          <div className="mt-2 flex justify-between font-heading text-meta text-text-muted">
            {GROWTH_STAGES.map((item, dot) => (
              <span key={item.stage} className={dot === index ? "font-bold text-accent-strong" : ""}>
                {item.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
