"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { STAGE_ART, type GrowthStage } from "../companion";
import { AriTile } from "../habits/views";
import { acknowledgeAchievement, getPendingAchievement, getToday, setAchievementShared } from "../mocks/repository";
import type { Achievement } from "../mocks/types";

/** Figma 07 · Achievement · Celebration. Shown once when the server reports a new keepsake. */
export function AchievementOverlay({ onShared }: { onShared: () => void }) {
  const [item, setItem] = useState<Achievement | null>(null);
  const [stage, setStage] = useState<GrowthStage>("teen");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let alive = true;
    const check = () =>
      void Promise.all([getPendingAchievement(), getToday()]).then(([pending, today]) => {
        if (!alive || !pending) return;
        setStage(today.companion.stage);
        setItem(pending);
      });
    check();
    window.addEventListener("momentum:achievement", check);
    return () => {
      alive = false;
      window.removeEventListener("momentum:achievement", check);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (item && dialog && !dialog.open) dialog.showModal();
  }, [item]);

  if (!item) return null;
  const current = item;

  function close() {
    void acknowledgeAchievement();
    dialogRef.current?.close();
    setItem(null);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="A little moment to celebrate"
      onCancel={close}
      className="fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-t-[32px] bg-[#f8f5fd] p-5 shadow-floating backdrop:bg-[#3b2a78]/45 md:inset-0 md:m-auto md:w-[560px] md:rounded-[28px]"
    >
      <p className="font-heading text-meta tracking-wide text-text-muted uppercase">A little moment to celebrate</p>
      <h2 className="mt-1 font-display text-title font-extrabold text-text">Look what you made room for.</h2>
      <p className="mt-1 font-heading text-label text-text-muted">
        {current.title} · {current.criteria.toLowerCase()}
      </p>
      <div className="mt-4">
        <AriTile art={STAGE_ART[stage].full} label="New keepsake" title={current.title} body={current.headline}>
          <span className="mt-3 flex gap-2">
            <span className="rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">+{current.xp} XP</span>
            <span className="rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">Private</span>
          </span>
        </AriTile>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <Link href="/me?view=achievements" onClick={close} className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable">
          See my keepsakes
        </Link>
        <button
          type="button"
          onClick={() =>
            void setAchievementShared(current.id, true).then(() => {
              onShared();
              close();
            })
          }
          className="w-full rounded-full bg-surface py-4 font-heading text-body font-bold text-accent-strong shadow-raised"
        >
          Share with your squad
        </button>
        <button type="button" onClick={close} className="font-heading text-label text-text-muted">
          Not now
        </button>
        <p className="rounded-[18px] bg-accent-tint p-3 font-heading text-meta text-text">Private by default. Nothing is shared unless you tap Share.</p>
      </div>
    </dialog>
  );
}
