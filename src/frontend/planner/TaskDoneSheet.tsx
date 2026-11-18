"use client";

import { useEffect, useRef } from "react";
import { Companion, type GrowthStage } from "../companion";
import { nextStageLabel } from "../home/growth";

export interface TaskDoneSheetProps {
  open: boolean;
  taskTitle: string;
  doneCount: number;
  totalCount: number;
  xpAwarded: number;
  stage: GrowthStage;
  xp: number;
  xpToNextStage: number | null;
  nextTaskTitle: string | null;
  onUndo: () => void;
  onNext: () => void;
  onClose: () => void;
}

const SPARKS = [
  "top-[18%] left-[10%] h-4 w-4 bg-[radial-gradient(circle_at_35%_30%,#fff,#f4a259)]",
  "top-[8%] left-[46%] h-2.5 w-2.5 bg-[radial-gradient(circle_at_35%_30%,#fff,#9b7be8)]",
  "top-[26%] right-[12%] h-3 w-3 bg-[radial-gradient(circle_at_35%_30%,#fff,#9b7be8)]",
  "top-[52%] right-[30%] h-2 w-2 bg-[radial-gradient(circle_at_35%_30%,#fff,#f29b9b)]",
  "top-[60%] left-[18%] h-2.5 w-2.5 bg-[radial-gradient(circle_at_35%_30%,#fff,#5cc9b5)]",
  "bottom-[18%] right-[16%] h-4 w-4 bg-[radial-gradient(circle_at_35%_30%,#fff,#f3c33f)]",
];

/** Figma 03 · Plan · Task done, Ari celebrates. Bottom sheet on mobile, centred card on desktop. */
export function TaskDoneSheet({
  open,
  taskTitle,
  doneCount,
  totalCount,
  xpAwarded,
  stage,
  xp,
  xpToNextStage,
  nextTaskTitle,
  onUndo,
  onNext,
  onClose,
}: TaskDoneSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const next = nextStageLabel(stage);
  const ratio = xpToNextStage ? Math.min(1, xp / xpToNextStage) : 1;
  const nextLabel = nextTaskTitle ? `Next: ${nextTaskTitle.split(" ")[0]}` : "All done";

  return (
    <dialog
      ref={dialogRef}
      aria-label="Task done"
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-t-[32px] bg-[#f8f5fd] p-5 pt-3 shadow-floating backdrop:bg-[#3b2a78]/45 md:inset-0 md:m-auto md:w-[520px] md:rounded-[28px] md:p-5"
    >
      <span aria-hidden className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-outline md:hidden" />
      <div className="relative flex h-[250px] items-end justify-center overflow-hidden rounded-[26px] bg-[#f4ecdf] shadow-raised">
        {SPARKS.map((spark) => (
          <span key={spark} aria-hidden className={`animate-cloud-drift absolute rounded-full shadow ${spark}`} />
        ))}
        {xpAwarded > 0 ? (
          <span className="animate-bubble-pop absolute top-6 right-[14%] rounded-full bg-[linear-gradient(180deg,#ffe08a,#f3b63f)] px-3.5 py-1.5 font-heading text-label font-bold text-[#6b4300] shadow-raised">
            +{xpAwarded} XP
          </span>
        ) : null}
        {open ? (
          <Companion stage={stage} reaction="taskDone" look={{ room: "lavender", outfit: "original" }} size="hero" className="mb-1" />
        ) : null}
      </div>

      <h2 className="mt-5 text-center font-display text-title font-extrabold text-text">Done! Ari is cheering.</h2>
      <p className="mt-2 text-center font-heading text-label text-text-muted">
        “{taskTitle}” · {doneCount} of {totalCount} today
      </p>

      <div className="mt-4 rounded-[20px] bg-accent-tint/70 px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-heading text-label font-bold text-text">
            {xp.toLocaleString("en-GB")}
            {xpToNextStage ? ` / ${xpToNextStage.toLocaleString("en-GB")} XP` : " XP"}
          </p>
          {next && xpToNextStage ? (
            <p className="font-heading text-meta text-text-muted">
              {Math.max(0, xpToNextStage - xp).toLocaleString("en-GB")} to {next}
            </p>
          ) : null}
        </div>
        <div className="mt-2 h-2 rounded-full bg-surface shadow-inset">
          <span className="block h-full rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${ratio * 100}%` }} />
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onUndo}
          className="flex-1 rounded-full bg-surface py-3.5 font-heading text-body font-bold text-accent-strong shadow-raised"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-full bg-[image:var(--gradient-primary)] py-3.5 font-heading text-body font-bold text-white shadow-pressable"
        >
          {nextLabel}
        </button>
      </div>
    </dialog>
  );
}
