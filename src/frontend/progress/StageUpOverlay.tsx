"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { STAGE_ART } from "../companion";
import { GROWTH_STAGES, stageIndex } from "../home/growth";
import { acknowledgeStageUp, getPendingStageUp } from "../api/liveRepository";
import type { StageUpEvent } from "../mocks/types";

const SPARKS = [
  "top-[10%] left-[14%] h-3 w-3",
  "top-[6%] right-[26%] h-2 w-2",
  "top-[18%] right-[8%] h-4 w-4",
  "top-[40%] left-[4%] h-2 w-2",
  "top-[52%] right-[4%] h-3 w-3",
  "bottom-[30%] left-[10%] h-2.5 w-2.5",
];

/**
 * Figma 05 · Growth · Stage up. Shows once, over any signed-in screen, when the
 * server reports that Ari reached a new permanent stage.
 */
export function StageUpOverlay({ onShare }: { onShare: () => void }) {
  const [event, setEvent] = useState<StageUpEvent | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let alive = true;
    const check = () =>
      void getPendingStageUp().then((pending) => {
        if (alive && pending) setEvent(pending);
      });
    check();
    window.addEventListener("momentum:stage-up", check);
    return () => {
      alive = false;
      window.removeEventListener("momentum:stage-up", check);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (event && dialog && !dialog.open) dialog.showModal();
  }, [event]);

  if (!event) return null;
  const index = stageIndex(event.stage);
  const label = GROWTH_STAGES[index]?.label ?? "New stage";

  function close() {
    if (event?.id) void acknowledgeStageUp(event.id);
    dialogRef.current?.close();
    setEvent(null);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Ari grew up"
      onCancel={close}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-[radial-gradient(circle_at_50%_30%,#4a2f97_0%,#2f1d66_50%,#1a1236_100%)] p-0 text-white backdrop:bg-[#1a1236]/80"
    >
      <div className="relative mx-auto flex min-h-dvh max-w-[560px] flex-col px-4 pt-14 pb-8">
        {SPARKS.map((spark) => (
          <span key={spark} aria-hidden className={`animate-cloud-drift absolute rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,#f3c879)] ${spark}`} />
        ))}
        <p className="text-center font-heading text-meta tracking-wide text-[#f3c879] uppercase">New stage unlocked</p>
        <h1 className="mt-2 text-center font-display text-display font-extrabold">Ari grew up!</h1>
        <div className="relative mx-auto mt-6 flex h-[400px] w-full max-w-[300px] items-end justify-center overflow-hidden rounded-t-[150px] rounded-b-[28px] bg-[radial-gradient(circle_at_50%_40%,#fff8ea,#f6e6c8)] shadow-[0_0_60px_rgba(243,200,121,.45)]">
          <span aria-hidden className="absolute bottom-6 h-12 w-52 rounded-[50%] bg-[linear-gradient(180deg,#f8e2b4,#e6b56a)] shadow-[0_8px_0_#d39c4e]" />
          <Image src={STAGE_ART[event.stage].full} alt={`Ari as a ${label}`} className="animate-companion-celebrate relative mb-8 h-[320px] w-auto" priority />
        </div>
        <section className="mt-6 rounded-[24px] border border-white/15 bg-white/[0.08] p-5 text-center">
          <p className="font-display text-heading font-extrabold">
            {label} · Stage {index + 1} of {GROWTH_STAGES.length}
          </p>
          <p className="mt-2 font-heading text-label text-white/80">
            {event.xp.toLocaleString("en-GB")} XP earned over {event.days} days. This growth is yours to keep.
          </p>
          <span className="mt-3 inline-block rounded-full bg-[#f3c879]/20 px-3 py-1 font-heading text-meta text-[#ffd98a]">Unlocked: {event.extra}</span>
        </section>
        <div className="mt-auto flex gap-3 pt-8">
          <button
            type="button"
            onClick={() => {
              onShare();
              close();
            }}
            className="flex-1 rounded-full bg-surface py-4 font-heading text-body font-bold text-accent-strong shadow-raised"
          >
            Share with your squad
          </button>
          <button type="button" onClick={close} className="flex-1 rounded-full bg-[image:var(--gradient-primary)] py-4 font-heading text-body font-bold text-white shadow-pressable">
            Continue
          </button>
        </div>
      </div>
    </dialog>
  );
}
