"use client";

import type { ReactNode } from "react";
import { Companion, GreetingBubble, useGreeting, type GrowthStage } from "../companion";
import { cn } from "../lib/cn";
import { Cloud, FlowerPot, PottedPlant, SparkleDashes, Twinkle } from "./SceneDecor";

export interface AuthSceneProps {
  title: string;
  subtitle: string;
  /** What the companion says when it pops up and waves. */
  greeting: string;
  stage?: GrowthStage;
  /** Small content above the title (e.g. step progress). */
  topSlot?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Soft "clay" scene for sign in / sign up (mobile-first):
 * lavender room, clouds and plants, a cream card, and the companion
 * peeking up from behind the form, then waving hello.
 */
export function AuthScene({ title, subtitle, greeting, stage = "teen", topSlot, children, footer }: AuthSceneProps) {
  const { reaction, hasGreeted, onReactionEnd, sayHello } = useGreeting(1000);

  return (
    <div className="relative flex min-h-dvh w-full justify-center overflow-hidden bg-[linear-gradient(180deg,#e7ddfb_0%,#d8caf5_70%,#cbbaf0_100%)] px-4 pt-8 pb-10">
      {/* Room decor */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 rounded-t-[50%] bg-[#c6b3ee]/70" />
      <Cloud className="top-24 -left-6 scale-90" />
      <Cloud className="top-40 -right-4 scale-75 [animation-delay:-4s]" />
      <PottedPlant className="bottom-6 -left-6 h-44 w-28 md:left-[8%] md:h-56 md:w-36" />
      <FlowerPot className="-right-3 bottom-8 h-36 w-24 md:right-[8%] md:h-48 md:w-32" />

      <div className="animate-rise-in relative z-10 flex w-full max-w-[400px] flex-col items-center rounded-[40px] bg-[#fbf6ee] px-5 pt-7 pb-7 shadow-[0_30px_60px_rgba(76,49,155,.28),inset_0_2px_0_rgba(255,255,255,.95),inset_0_-6px_0_rgba(214,200,240,.55)]">
        {topSlot ? <div className="mb-3 w-full">{topSlot}</div> : null}
        <div className="flex items-center gap-2">
          <SparkleDashes side="left" />
          <h1 className="text-center font-display text-title font-extrabold text-accent-strong">{title}</h1>
          <SparkleDashes side="right" />
        </div>
        <p className="mt-1 text-center font-heading text-body text-text-muted">{subtitle}</p>

        {/* Companion peeking over the form */}
        <div className="relative mt-2 flex h-[170px] w-full justify-center">
          <Twinkle className="top-6 left-6" />
          <Twinkle className="top-16 right-10 h-3.5 w-3.5 [animation-delay:-1.2s]" />
          <div className="animate-companion-peek absolute bottom-[-24px]">
            <Companion
              stage={stage}
              reaction={reaction}
              look={{ room: "lavender", outfit: "original" }}
              size="bust"
              onTap={sayHello}
              onReactionEnd={onReactionEnd}
              followPointer
            />
          </div>
          <GreetingBubble visible={hasGreeted} wave className="absolute top-2 left-[calc(50%+28px)] max-w-[150px]">
            {greeting}
          </GreetingBubble>
        </div>

        {/* Form panel sits in front of the companion */}
        <div
          className={cn(
            "relative z-10 flex w-full flex-col gap-3.5 rounded-[30px] bg-[#fffaf3] p-4",
            "shadow-[0_-8px_24px_rgba(76,49,155,.10),inset_0_2px_0_rgba(255,255,255,1),inset_0_-4px_0_rgba(226,214,246,.6)]",
          )}
        >
          {children}
        </div>

        {footer ? <div className="mt-5 w-full text-center">{footer}</div> : null}
      </div>
    </div>
  );
}

export interface SocialButtonsProps {
  onSelect: (provider: "google" | "apple") => void;
  google: ReactNode;
  apple: ReactNode;
}

/** "or continue with" row of round clay provider buttons. */
export function SocialButtons({ onSelect, google, apple }: SocialButtonsProps) {
  const buttonClass =
    "flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_16px_rgba(76,49,155,.18),inset_0_-3px_0_rgba(214,204,240,.8)] transition-transform active:translate-y-0.5";

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full items-center gap-3">
        <span className="h-px flex-1 bg-outline" />
        <span className="font-heading text-meta text-text-muted">or continue with</span>
        <span className="h-px flex-1 bg-outline" />
      </div>
      <div className="flex gap-5">
        <button type="button" aria-label="Continue with Google" onClick={() => onSelect("google")} className={buttonClass}>
          {google}
        </button>
        <button type="button" aria-label="Continue with Apple" onClick={() => onSelect("apple")} className={buttonClass}>
          {apple}
        </button>
      </div>
    </div>
  );
}
