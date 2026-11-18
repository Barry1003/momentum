"use client";

import Image from "next/image";
import Link from "next/link";
import ariFace from "../assets/companion/ari-teen-face.png";
import { Skeleton } from "../components";
import { SparkleIcon } from "../home/icons";
import { cn } from "../lib/cn";
import type { PlannerData, Task } from "../mocks/types";
import { SLOT_LABELS, slotFor, type DaySlot, type WeekDay } from "./dates";
import { SegmentedTabs, TaskCheck } from "./parts";

function taskMeta(task: Task) {
  const parts: string[] = [];
  if (task.durationMinutes) parts.push(`${task.durationMinutes} min`);
  if (task.category) parts.push(task.category);
  if (task.goalName) parts.push(`Goal: ${task.goalName}`);
  return parts;
}

function TodayTaskRow({ task, onToggle }: { task: Task; onToggle: (task: Task) => void }) {
  const meta = taskMeta(task);
  return (
    <li className="flex items-center gap-4 rounded-[22px] bg-surface px-4 py-3.5 shadow-raised">
      <TaskCheck
        id={`today-${task.id}`}
        label={task.isDone ? `Mark ${task.title} as not done` : `Complete ${task.title}`}
        checked={task.isDone}
        onChange={() => onToggle(task)}
      />
      <div className="min-w-0">
        <p className={cn("font-heading text-body font-bold", task.isDone ? "text-text-muted" : "text-text")}>{task.title}</p>
        <p className="font-heading text-meta text-text-muted">
          {meta.join(" · ")}
          {task.isShared ? (
            <>
              {meta.length ? " · " : ""}
              <Link href="/planner?view=shared" className="underline-offset-2 hover:underline">
                shared with {task.sharedByName ?? "your squad"}
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </li>
  );
}

function SlotHeading({ slot }: { slot: DaySlot }) {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-full bg-accent-tint px-3 py-1 font-heading text-meta font-bold text-accent-strong uppercase">
        {SLOT_LABELS[slot].label}
      </span>
      <span aria-hidden className="h-px flex-1 bg-outline" />
      <span className="font-heading text-meta text-text-muted">{SLOT_LABELS[slot].hours}</span>
    </div>
  );
}

export function TodayWeekStrip({ week, counts, selectedIso, hrefFor }: {
  week: WeekDay[];
  counts: number[];
  selectedIso: string;
  hrefFor: (day: WeekDay) => string;
}) {
  return (
    <nav aria-label="This week" className="flex justify-between rounded-[26px] bg-surface px-2 py-3 shadow-raised">
      {week.map((day) => {
        const selected = day.iso === selectedIso;
        return (
          <Link
            key={day.iso}
            href={hrefFor(day)}
            scroll={false}
            aria-current={selected ? "date" : undefined}
            aria-label={`${day.dayLabel} ${day.dateLabel}, ${counts[day.index] ?? 0} tasks`}
            className={cn(
              "flex w-11 flex-col items-center gap-1 rounded-[16px] py-2 font-heading",
              selected ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : "text-text",
            )}
          >
            <span className={cn("text-meta", selected ? "text-white/85" : "text-text-muted")}>{day.dayLabel}</span>
            <span className="text-body font-bold">{day.dateLabel}</span>
            <span aria-hidden className="flex h-1.5 gap-0.5">
              {Array.from({ length: Math.min(3, counts[day.index] ?? 0) }, (_, dot) => (
                <span key={dot} className={cn("h-1.5 w-1.5 rounded-full", selected ? "bg-white" : "bg-accent")} />
              ))}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export interface TodayViewProps {
  week: WeekDay[];
  todayIso: string;
  tasks: Task[] | null;
  planner: PlannerData | null;
  onToggle: (task: Task) => void;
  onMoveCarryOver: () => void;
  onPickCarryOverDay: () => void;
  onSuggestions: () => void;
}

/** Figma 03 · Planner · Today. Desktop: three columns. */
export function TodayView({ week, todayIso, tasks, planner, onToggle, onMoveCarryOver, onPickCarryOverDay, onSuggestions }: TodayViewProps) {
  const sorted = [...(tasks ?? [])].sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
  const slots: DaySlot[] = ["morning", "afternoon", "evening"];
  const total = tasks?.length ?? 0;

  const left = (
    <div className="flex flex-col gap-4">
      <SegmentedTabs active="today" />
      <TodayWeekStrip
        week={week}
        counts={planner?.weekTaskCounts.map((count, index) => (week[index]?.iso === todayIso ? total : count)) ?? []}
        selectedIso={todayIso}
        hrefFor={(day) => (day.iso === todayIso ? "/planner" : `/planner?view=week&day=${day.iso}`)}
      />
      <section aria-label="Ari's tip" className="flex items-start gap-3 rounded-[24px] bg-[#f8efdf] p-4 shadow-raised">
        <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface shadow-raised ring-[3px] ring-white">
          <Image src={ariFace} alt="" width={48} height={48} className="h-full w-full object-cover" />
        </span>
        <div>
          <p className="font-heading text-label font-bold text-accent-strong">Ari</p>
          <p className="font-heading text-label text-text">
            {total === 0
              ? "Nothing planned yet. Pick one small thing to start."
              : `${total} ${total === 1 ? "thing" : "things"} today. Start with the hardest while you are fresh.`}
          </p>
        </div>
      </section>
    </div>
  );

  const middle = tasks ? (
    <div className="flex flex-col gap-4">
      {slots.map((slot) => {
        const inSlot = sorted.filter((task) => slotFor(task.time) === slot);
        if (inSlot.length === 0) return null;
        return (
          <section key={slot} aria-label={SLOT_LABELS[slot].label} className="flex flex-col gap-3">
            <SlotHeading slot={slot} />
            <ul className="flex flex-col gap-2.5">
              {inSlot.map((task) => (
                <TodayTaskRow key={task.id} task={task} onToggle={onToggle} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  ) : (
    <Skeleton className="h-64 rounded-[24px]" />
  );

  const right = (
    <div className="flex flex-col gap-4">
      {planner?.carryOver ? (
        <section className="rounded-[26px] bg-[#fdeedd] p-4 shadow-raised">
          <p className="font-heading text-meta tracking-wide text-[#9a5b12] uppercase">From yesterday · No stress</p>
          <p className="mt-2 font-heading text-body font-bold text-text">{planner.carryOver.title}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onMoveCarryOver}
              className="rounded-full bg-surface px-4 py-2.5 font-heading text-label font-bold text-accent-strong shadow-raised"
            >
              Move to today
            </button>
            <button type="button" onClick={onPickCarryOverDay} className="px-4 py-2.5 font-heading text-label font-bold text-text-muted">
              Pick a day
            </button>
          </div>
        </section>
      ) : null}
      {planner && planner.suggestedActionCount > 0 ? (
        <button
          type="button"
          onClick={onSuggestions}
          className="flex items-center gap-3 rounded-[24px] bg-surface p-4 text-left shadow-raised"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-white shadow-pressable">
            <SparkleIcon className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-heading text-body font-bold text-text">
              {planner.suggestedActionCount} suggested actions waiting
            </span>
            <span className="block font-heading text-meta text-text-muted">From your Harada grid · drafts until you accept</span>
          </span>
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:items-start">
      {left}
      {middle}
      {right}
    </div>
  );
}
