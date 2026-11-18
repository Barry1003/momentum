"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, Sheet } from "../components";
import { cn } from "../lib/cn";
import { createGoal } from "../mocks/repository";
import type { NewHabitInput, NewTaskInput } from "../mocks/types";
import { CheckIcon, PlayIcon, SparkleIcon, WaterIcon } from "./icons";

export type QuickCreateKind = "task" | "habit" | "goal" | "focus";

const KINDS: { kind: QuickCreateKind; label: string; icon: ReactNode }[] = [
  { kind: "task", label: "Task", icon: <CheckIcon className="h-5 w-5" /> },
  { kind: "habit", label: "Habit", icon: <WaterIcon className="h-5 w-5" /> },
  { kind: "goal", label: "Goal", icon: <SparkleIcon className="h-5 w-5" /> },
  { kind: "focus", label: "Focus", icon: <PlayIcon className="h-5 w-5" /> },
];

const PLACEHOLDER: Record<QuickCreateKind, string> = {
  task: "e.g. Practice JS for 30 min",
  habit: "e.g. Drink water",
  goal: "e.g. Become a confident developer",
  focus: "What will you focus on? (optional)",
};

const SUBMIT_LABEL: Record<QuickCreateKind, string> = {
  task: "Add to today",
  habit: "Start this habit",
  goal: "Create goal",
  focus: "Start focus",
};

export interface QuickCreateSheetProps {
  open: boolean;
  initialKind: QuickCreateKind;
  onClose: () => void;
  onAddTask: (input: NewTaskInput) => Promise<void>;
  onAddHabit: (input: NewHabitInput) => Promise<void>;
  onNotice: (message: string) => void;
}

function ToggleChip({ label, pressed, onToggle }: { label: string; pressed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={cn(
        "rounded-chip px-3 py-1.5 font-heading text-meta font-bold transition-colors duration-150",
        pressed ? "bg-accent-tint text-accent-strong outline outline-1 outline-accent" : "bg-transparent text-text-muted",
      )}
    >
      {label}
    </button>
  );
}

/** Quick create (+): add a task, habit, goal or start focus from anywhere. Figma 02 · Home, step 04. */
export function QuickCreateSheet({ open, initialKind, onClose, onAddTask, onAddHabit, onNotice }: QuickCreateSheetProps) {
  const router = useRouter();
  const [kind, setKind] = useState<QuickCreateKind>(initialKind);
  const [title, setTitle] = useState("");
  const [isToday, setIsToday] = useState(true);
  const [duration, setDuration] = useState<number | null>(30);
  const [linkGoal, setLinkGoal] = useState(true);
  const [isPrivate, setIsPrivate] = useState(true);
  const [repeats, setRepeats] = useState(false);
  const [isPriority, setIsPriority] = useState(false);
  const [habitTarget, setHabitTarget] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    const trimmed = title.trim();
    if (kind !== "focus" && trimmed.length < 2) {
      setError("Give it a short name first.");
      return;
    }
    setIsSaving(true);
    try {
      if (kind === "task") {
        await onAddTask({
          title: trimmed,
          durationMinutes: duration ?? undefined,
          category: linkGoal ? "Confident developer" : undefined,
        });
      } else if (kind === "habit") {
        await onAddHabit({ name: trimmed, targetCount: habitTarget });
      } else if (kind === "goal") {
        const goal = await createGoal({ title: trimmed });
        router.push(`/goals/${goal.id}`);
      } else {
        router.push("/focus");
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="What would you like to add?">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 font-heading text-label font-bold text-text-muted hover:text-text"
      >
        Close
      </button>

      <div role="radiogroup" aria-label="What to add" className="grid grid-cols-4 gap-2">
        {KINDS.map((item) => {
          const isSelected = item.kind === kind;
          return (
            <button
              key={item.kind}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                setKind(item.kind);
                setError(null);
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-[20px] py-3 font-heading text-meta font-bold transition-colors duration-150",
                isSelected ? "bg-surface text-accent-strong shadow-raised outline outline-2 outline-accent" : "bg-accent-tint text-text-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  isSelected ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : "bg-surface text-accent-strong shadow-raised",
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="sr-only">{kind === "habit" ? "Habit name" : kind === "goal" ? "Goal" : "Title"}</span>
        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setError(null);
          }}
          placeholder={PLACEHOLDER[kind]}
          aria-invalid={Boolean(error)}
          className="w-full rounded-input bg-surface px-4 py-3.5 font-heading text-body text-text shadow-inset outline outline-2 outline-accent placeholder:text-text-muted"
        />
      </label>
      {error ? (
        <p role="alert" className="mt-1.5 font-heading text-meta text-warning">
          {error}
        </p>
      ) : null}

      {kind === "task" ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <ToggleChip label="Today" pressed={isToday} onToggle={() => setIsToday((value) => !value)} />
            <ToggleChip
              label={duration ? `${duration} min` : "No time"}
              pressed={duration !== null}
              onToggle={() => setDuration((value) => (value === null ? 15 : value === 15 ? 30 : value === 30 ? 45 : null))}
            />
            <ToggleChip label="Goal: Confident developer" pressed={linkGoal} onToggle={() => setLinkGoal((value) => !value)} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <ToggleChip label={isPrivate ? "Private" : "Shared"} pressed={!isPrivate} onToggle={() => setIsPrivate((value) => !value)} />
            <ToggleChip label="Repeat" pressed={repeats} onToggle={() => setRepeats((value) => !value)} />
            <ToggleChip label="Priority" pressed={isPriority} onToggle={() => setIsPriority((value) => !value)} />
          </div>
          <p className="mt-3 rounded-note bg-cream px-4 py-2.5 font-heading text-meta text-accent-strong">
            Finishing this earns XP for Ari.
          </p>
        </>
      ) : null}

      {kind === "habit" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-heading text-meta text-text-muted">Times a day</span>
          {[1, 2, 4, 8].map((count) => (
            <ToggleChip key={count} label={String(count)} pressed={habitTarget === count} onToggle={() => setHabitTarget(count)} />
          ))}
        </div>
      ) : null}

      <Button className="mt-4 w-full" fullWidth={false} disabled={isSaving} onClick={() => void handleSubmit()}>
        {SUBMIT_LABEL[kind]}
      </Button>
    </Sheet>
  );
}
