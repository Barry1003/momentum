"use client";

import Link from "next/link";
import { CheckOrb, LinkButton } from "../components";
import { cn } from "../lib/cn";
import type { Habit, Task } from "../mocks/types";
import { CheckIcon, ChevronRightIcon, MoveIcon, PlayIcon, PlusIcon, ReadIcon, SparkleIcon, WaterIcon } from "./icons";

function taskMeta(task: Task, detailed: boolean): string {
  const parts: string[] = [];
  if (task.durationMinutes) parts.push(`${task.durationMinutes} min`);
  if (task.category) parts.push(task.category);
  if (detailed && task.goalId) parts.push("Goal: Become a confident developer");
  if (task.isShared) parts.push(detailed && task.sharedByName ? `shared with ${task.sharedByName}` : "shared");
  if (task.isDone) parts.push("done");
  return parts.join(" · ");
}

/** Dark "one thing at a time" card for the next open task. */
export function UpNextCard({ task, onStart, desktop }: { task: Task | null; onStart: () => void; desktop?: boolean }) {
  return (
    <section
      aria-label="Up next"
      className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#3b2a78,#5a3fb0)] p-5 text-white shadow-floating"
    >
      <span aria-hidden className="pointer-events-none absolute -top-10 -right-6 h-32 w-32 rounded-full bg-white/10 blur-xl" />
      <p className="font-heading text-meta font-bold tracking-wide text-white/70 uppercase">Up next · One thing at a time</p>
      {task ? (
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-heading font-extrabold">{task.title}</p>
            <p className="mt-0.5 font-heading text-label text-white/75">
              {taskMeta(task, false)}
              {desktop ? " · no session running" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 font-heading text-label font-bold text-accent-strong shadow-pressable transition active:translate-y-0.5"
          >
            <PlayIcon className="h-4 w-4" />
            {desktop ? "Start focus" : "Start"}
          </button>
        </div>
      ) : (
        <p className="mt-2 font-display text-heading font-extrabold">Everything for today is done. Rest counts too.</p>
      )}
    </section>
  );
}

export function PrioritiesCard({
  tasks,
  onComplete,
  onAdd,
  desktop,
}: {
  tasks: Task[];
  onComplete: (id: string) => void;
  onAdd: () => void;
  desktop?: boolean;
}) {
  const done = tasks.filter((task) => task.isDone).length;
  return (
    <section aria-labelledby="priorities-title" className="rounded-[28px] bg-surface p-5 shadow-raised">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="priorities-title" className="font-display text-heading font-extrabold text-text">
            Today&apos;s priorities
          </h2>
          <p className="font-heading text-label text-text-muted">
            {done} of {tasks.length} done · no rush
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-full bg-accent-tint px-3.5 py-2 font-heading text-label font-bold text-accent-strong"
        >
          <PlusIcon className="h-4 w-4" />
          {desktop ? "Add task" : "Add"}
        </button>
      </div>
      <ul className="mt-3 divide-y divide-outline">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-3 py-3">
            <CheckOrb
              id={`task-${task.id}`}
              label={`Complete ${task.title}`}
              checked={task.isDone}
              disabled={task.isDone}
              onChange={() => onComplete(task.id)}
            />
            <div className="min-w-0">
              <p className={cn("font-heading text-body font-bold", task.isDone ? "text-text-muted line-through" : "text-text")}>
                {task.title}
              </p>
              <p className="font-heading text-meta text-text-muted">{taskMeta(task, Boolean(desktop))}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const HABIT_ICONS = { water: WaterIcon, move: MoveIcon, read: ReadIcon, sparkle: SparkleIcon } as const;

function habitStatus(habit: Habit): string {
  if (habit.completedCount >= habit.targetCount) return "Done today";
  if (habit.targetCount > 1) return `${habit.completedCount} of ${habit.targetCount} ${habit.unit ?? "times"}`;
  return "Tap to check";
}

export function HabitsCard({ habits, onIncrement }: { habits: Habit[]; onIncrement: (id: string) => void }) {
  const done = habits.filter((habit) => habit.completedCount >= habit.targetCount).length;
  return (
    <section aria-labelledby="habits-title" className="rounded-[28px] bg-surface p-5 shadow-raised">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="habits-title" className="font-display text-heading font-extrabold text-text">
            Habits
          </h2>
          <p className="font-heading text-label text-text-muted">
            {done} of {habits.length} · keep it gentle
          </p>
        </div>
        <Link
          href="/habits"
          className="inline-flex items-center gap-1 rounded-full bg-accent-tint px-3.5 py-2 font-heading text-label font-bold text-accent-strong"
        >
          Tracker
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
      <ul className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(4, Math.max(1, habits.length))}, minmax(0, 1fr))` }}>
        {habits.map((habit) => {
          const Icon = HABIT_ICONS[habit.icon ?? "sparkle"];
          const complete = habit.completedCount >= habit.targetCount;
          const ratio = Math.min(1, habit.completedCount / Math.max(1, habit.targetCount));
          return (
            <li key={habit.id} className="flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => onIncrement(habit.id)}
                disabled={complete}
                aria-label={`${habit.name}: ${habitStatus(habit)}`}
                className="relative grid h-16 w-16 place-items-center rounded-full bg-accent-tint shadow-raised transition active:scale-95 disabled:cursor-default"
                style={{
                  backgroundImage: `conic-gradient(var(--color-accent) ${ratio * 360}deg, transparent 0)`,
                }}
              >
                <span
                  className={cn(
                    "grid h-[52px] w-[52px] place-items-center rounded-full",
                    complete ? "bg-[image:var(--gradient-primary)] text-white" : "bg-surface text-accent-strong",
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
                {complete ? (
                  <span className="absolute -right-0.5 -bottom-0.5 grid h-5 w-5 place-items-center rounded-full bg-success text-white ring-2 ring-white">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                ) : null}
              </button>
              <p className="mt-2 font-heading text-label font-bold text-text">{habit.name}</p>
              <p className={cn("font-heading text-meta", complete ? "text-success" : "text-text-muted")}>{habitStatus(habit)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function GrowthStudioCard() {
  return (
    <section className="rounded-[28px] bg-[linear-gradient(135deg,#f3eefe,#fdf3ea)] p-5 shadow-raised">
      <p className="font-heading text-meta font-bold tracking-wide text-accent uppercase">Growth Studio · Optional</p>
      <p className="mt-1 font-display text-heading font-extrabold text-text">A clearer direction</p>
      <p className="mt-1 font-heading text-label text-text-muted">
        Life Audit · 4 of 12 reflections. Private, editable, yours to skip.
      </p>
      <LinkButton href="/growth?view=welcome" variant="secondary" fullWidth={false} className="mt-4">
        Continue Life Audit →
      </LinkButton>
    </section>
  );
}

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

export function MyProgressCard({ daysShowingUp = 6 }: { daysShowingUp?: number }) {
  return (
    <section className="rounded-[28px] bg-surface p-5 shadow-raised">
      <p className="font-heading text-meta font-bold tracking-wide text-accent uppercase">My progress</p>
      <p className="mt-1 font-display text-heading font-extrabold text-text">{daysShowingUp} days showing up</p>
      <p className="mt-1 font-heading text-label text-text-muted">Your earned growth stays with you, even on a day off.</p>
      <ol className="mt-4 flex justify-between" aria-label="This week">
        {WEEK.map((day, index) => {
          const active = index < daysShowingUp;
          return (
            <li key={`${day}-${index}`} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "h-7 w-7 rounded-full",
                  active ? "bg-[image:var(--gradient-primary)] shadow-pressable" : "bg-accent-tint shadow-inset",
                )}
              />
              <span className="font-heading text-meta text-text-muted">{day}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
