"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CheckOrb, Skeleton } from "../components";
import { CalendarIcon, CheckIcon, ChevronRightIcon, MoveIcon, ReadIcon, SparkleIcon, WaterIcon } from "../home/icons";
import { cn } from "../lib/cn";
import type { ConsistencyMoment, Habit, HabitKind, HabitTracker } from "../mocks/types";
import { Badge, Panel, Pill, PillButton, PlusButton, SubHeader } from "../planner/parts";
import {
  DAY_LETTER,
  DAY_SHORT,
  EVERY_DAY,
  WEEKDAYS,
  isPausedNow,
  longDate,
  monthCells,
  sameDays,
  scheduleLabel,
  scheduledOn,
  shortName,
  shortRange,
  todayLine,
  verbFor,
  weekDates,
  weekdayDate,
} from "./format";

export type HabitsView = "today" | "week" | "month" | "all" | "day" | "new" | "edit" | "pause";

const ICONS = { water: WaterIcon, move: MoveIcon, read: ReadIcon, sparkle: SparkleIcon } as const;

export function HabitIcon({ habit, filled, className }: { habit: Habit; filled?: boolean; className?: string }) {
  const Icon = ICONS[habit.icon ?? "sparkle"];
  return (
    <span
      className={cn(
        "grid h-12 w-12 shrink-0 place-items-center rounded-full",
        filled
          ? "bg-[radial-gradient(circle_at_35%_30%,#a88bf0,#5a3fb0)] text-white shadow-pressable"
          : "bg-[radial-gradient(circle_at_35%_30%,#ffffff,#e6def8)] text-accent-strong shadow-raised",
        className,
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

const TABS: { view: HabitsView; label: string }[] = [
  { view: "today", label: "Today" },
  { view: "week", label: "Week" },
  { view: "month", label: "Month" },
  { view: "all", label: "All" },
];

export function habitsHref(view: HabitsView, extra = ""): string {
  const query = view === "today" ? extra : `view=${view}${extra ? `&${extra}` : ""}`;
  return query ? `/habits?${query}` : "/habits";
}

export function HabitTabs({ active, pills }: { active: HabitsView; pills?: boolean }) {
  if (pills) {
    return (
      <nav aria-label="Habit views" className="flex flex-wrap gap-2">
        {TABS.filter((tab) => tab.view !== "all").map((tab) => (
          <Link key={tab.view} href={habitsHref(tab.view)} scroll={false} aria-current={tab.view === active ? "page" : undefined}>
            <Pill selected={tab.view === active}>{tab.label}</Pill>
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label="Habit views" className="flex rounded-full bg-accent-tint/70 p-1 shadow-inset">
      {TABS.map((tab) => (
        <Link
          key={tab.view}
          href={habitsHref(tab.view)}
          scroll={false}
          aria-current={tab.view === active ? "page" : undefined}
          className={cn(
            "flex-1 rounded-full py-2.5 text-center font-heading text-label font-bold transition",
            tab.view === active ? "bg-surface text-accent-strong shadow-raised" : "text-text-muted",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function Split({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
      <div className="flex flex-col gap-5">{left}</div>
      <div className="flex flex-col gap-5">{right}</div>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, type = "button" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 font-heading text-body font-bold text-white shadow-pressable disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const className = "block w-full rounded-full bg-surface py-4 text-center font-heading text-body font-bold text-accent-strong shadow-raised";
  return href ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function AriTile({ art, label, title, body, children }: { art: StaticImageData; label: string; title: string; body: string; children?: ReactNode }) {
  return (
    <section className="flex items-stretch overflow-hidden rounded-[26px] bg-[#f8f0e2] shadow-floating">
      <div className="flex flex-1 flex-col justify-center p-5">
        <p className="font-heading text-meta tracking-wide text-accent-strong uppercase">{label}</p>
        <p className="mt-2 font-display text-heading font-extrabold text-text">{title}</p>
        <p className="mt-2 font-heading text-label text-text-muted">{body}</p>
        {children}
      </div>
      <div className="relative w-[96px] shrink-0 bg-[#f1e8da] sm:w-[120px]">
        <Image src={art} alt="Ari" fill sizes="120px" className="object-contain object-bottom" />
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Today

function TodayRow({ habit, todayIso, pending, onLog, onResume }: { habit: Habit; todayIso: string; pending: number; onLog: () => void; onResume: () => void }) {
  const count = Math.min(habit.targetCount, habit.completedCount + pending);
  const done = count >= habit.targetCount;
  const paused = isPausedNow(habit, todayIso) && !habit.isScheduledToday;
  const notYet = habit.startsOn && habit.startsOn > todayIso;
  const isCounted = habit.kind === "target" || habit.targetCount > 1;
  const display = { ...habit, completedCount: count };

  let action: ReactNode;
  if (notYet) action = <Badge>Starts tomorrow</Badge>;
  else if (paused) {
    action = (
      <button type="button" onClick={onResume}>
        <Badge tone="warm">Paused · Resume</Badge>
      </button>
    );
  } else if (!habit.isScheduledToday) action = <Badge tone="warm">Rest day</Badge>;
  else if (done) action = <span className="rounded-full bg-success-tint px-4 py-2 font-heading text-label font-bold text-success">Done</span>;
  else
    action = (
      <button
        type="button"
        onClick={onLog}
        className="rounded-full bg-[image:var(--gradient-primary)] px-4 py-2.5 font-heading text-label font-bold text-white shadow-pressable active:translate-y-0.5"
        aria-label={isCounted ? `Add one to ${habit.name}` : `Check ${habit.name}`}
      >
        {isCounted ? "+1" : "Check"}
      </button>
    );

  return (
    <li className="flex items-center gap-4 rounded-[24px] bg-surface p-4 shadow-raised">
      <HabitIcon habit={habit} filled={done} />
      <div className="min-w-0 flex-1">
        <p className="font-heading text-body font-bold text-text">{habit.name}</p>
        <p className="font-heading text-meta text-text-muted">
          {paused ? `Paused${habit.pausedUntil ? ` until ${longDate(habit.pausedUntil)}` : ""}` : todayLine(display)}
          {pending ? " · waiting to sync" : ""}
        </p>
        {isCounted && !paused ? (
          <span aria-hidden className="mt-1.5 flex gap-1">
            {Array.from({ length: Math.min(12, habit.targetCount) }, (_, index) => (
              <span key={index} className={cn("h-1.5 w-4 rounded-full", index < count ? "bg-accent" : "bg-accent-tint")} />
            ))}
          </span>
        ) : null}
      </div>
      {action}
    </li>
  );
}

function WeekGrid({ tracker }: { tracker: HabitTracker }) {
  const dates = weekDates(tracker.todayIso, 0);
  return (
    <Panel>
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr>
            <th className="sr-only">Habit</th>
            {DAY_LETTER.map((letter, index) => (
              <th key={index} className="font-heading text-meta font-normal text-text-muted">
                {letter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tracker.habits.map((habit) => (
            <tr key={habit.id}>
              <th scope="row" className="pr-2 text-left font-heading text-label font-normal text-text">
                {shortName(habit)}
              </th>
              {dates.map((iso) => {
                const scheduled = scheduledOn(habit, iso);
                const met = (tracker.history[habit.id]?.[iso] ?? 0) >= habit.targetCount;
                const isToday = iso === tracker.todayIso;
                const future = iso > tracker.todayIso;
                const label = `${shortName(habit)} ${weekdayDate(iso)}: ${!scheduled ? "rest day" : met ? "showed up" : future ? "coming up" : isToday ? "not yet" : "not this time"}`;
                return (
                  <td key={iso} className="text-center">
                    <span
                      role="img"
                      aria-label={label}
                      className={cn(
                        "mx-auto block h-7 w-7 rounded-[8px]",
                        !scheduled
                          ? "border border-dashed border-outline"
                          : met
                            ? "bg-[image:var(--gradient-primary)] shadow-pressable"
                            : "bg-accent-tint shadow-inset",
                        isToday ? "outline outline-2 outline-offset-1 outline-accent" : "",
                      )}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export function TodayHabits({
  tracker,
  face,
  pending,
  onLog,
  onResume,
}: {
  tracker: HabitTracker;
  face: StaticImageData;
  pending: Record<string, number>;
  onLog: (habit: Habit) => void;
  onResume: (habit: Habit) => void;
}) {
  const scheduled = tracker.habits.filter((habit) => habit.isScheduledToday);
  const doneCount = scheduled.filter((habit) => habit.completedCount + (pending[habit.id] ?? 0) >= habit.targetCount).length;
  const open = scheduled.find((habit) => habit.completedCount + (pending[habit.id] ?? 0) < habit.targetCount && (habit.kind === "target" || habit.targetCount > 1));
  const best = [...tracker.habits].sort((a, b) => (tracker.rhythms[b.id] ?? 0) - (tracker.rhythms[a.id] ?? 0))[0];
  const bestRun = best ? (tracker.rhythms[best.id] ?? 0) : 0;
  const ratio = scheduled.length ? doneCount / scheduled.length : 0;

  const summary = (
    <section className="flex items-center gap-4 rounded-[28px] bg-[#f8f0e2] p-4 shadow-floating">
      <span
        className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(var(--color-accent) ${ratio * 360}deg, #e9e1f7 0)` }}
        aria-hidden
      >
        <span className="block h-[82px] w-[82px] overflow-hidden rounded-full border-4 border-[#f8f0e2] bg-surface">
          <Image src={face} alt="" width={82} height={82} className="h-full w-full object-cover" />
        </span>
      </span>
      <div className="min-w-0">
        <p className="font-display text-heading font-extrabold text-text">
          {doneCount} of {scheduled.length} today
        </p>
        <p className="mt-1 font-heading text-label text-text-muted">
          {scheduled.length === 0
            ? "A rest day for every habit. Enjoy it."
            : doneCount === scheduled.length
              ? "All kept today. Rest easy."
              : open
                ? `Nice rhythm. ${shortName(open)} is the one to finish before bed.`
                : "Nice rhythm. One more and today is kept."}
        </p>
        {bestRun >= 3 && best ? (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 font-heading text-meta font-bold text-accent-strong shadow-raised">
            <SparkleIcon className="h-3.5 w-3.5" />
            {bestRun}-day rhythm on {shortName(best)}
          </span>
        ) : null}
      </div>
    </section>
  );

  return (
    <Split
      left={
        <>
          <HabitTabs active="today" />
          {summary}
          <section aria-labelledby="your-habits">
            <h2 id="your-habits" className="font-display text-heading font-extrabold text-text">
              Your habits
            </h2>
            <p className="font-heading text-label text-text-muted">Tap the button to log. Pausing never breaks a streak.</p>
            <ul className="mt-3 flex flex-col gap-3">
              {tracker.habits.map((habit) => (
                <TodayRow
                  key={habit.id}
                  habit={habit}
                  todayIso={tracker.todayIso}
                  pending={pending[habit.id] ?? 0}
                  onLog={() => onLog(habit)}
                  onResume={() => onResume(habit)}
                />
              ))}
            </ul>
          </section>
        </>
      }
      right={
        <section aria-labelledby="this-week">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="this-week" className="font-display text-heading font-extrabold text-text">
                This week
              </h2>
              <p className="font-heading text-label text-text-muted">Filled = showed up. Rest days are part of the plan</p>
            </div>
            <Link href={habitsHref("month")} className="rounded-full bg-accent-tint px-4 py-2 font-heading text-label font-bold text-accent-strong">
              Month
            </Link>
          </div>
          <WeekGrid tracker={tracker} />
        </section>
      }
    />
  );
}

// ------------------------------------------------------------------ Week

export function WeekHabits({ tracker, offset }: { tracker: HabitTracker; offset: number }) {
  const dates = weekDates(tracker.todayIso, offset);
  const counted = dates.filter((iso) => iso <= tracker.todayIso);
  const rows = tracker.habits.map((habit) => {
    const scheduledDays = dates.filter((iso) => scheduledOn(habit, iso));
    const met = counted.filter((iso) => scheduledOn(habit, iso) && (tracker.history[habit.id]?.[iso] ?? 0) >= habit.targetCount).length;
    return { habit, scheduled: scheduledDays.length, met };
  });
  const totalScheduled = rows.reduce((sum, row) => sum + row.scheduled, 0);
  const totalMet = rows.reduce((sum, row) => sum + row.met, 0);

  return (
    <>
      <SubHeader
        backHref="/habits"
        backLabel="Back to habits"
        kicker="Habits · Week"
        title={offset === 0 ? "Your rhythm this week." : "Your rhythm that week."}
        subtitle={`${shortRange(dates)} · ${totalMet} of ${totalScheduled} scheduled`}
      />
      <Split
        left={<HabitTabs active="week" pills />}
        right={
          <>
            <Panel>
              <ul className="divide-y divide-outline">
                {rows.map(({ habit, scheduled, met }) => (
                  <li key={habit.id} className="flex items-center gap-3 py-3">
                    <HabitIcon habit={habit} className="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-body font-bold text-text">
                        {habit.name}
                        {habit.kind === "target" ? ` · ${habit.targetCount} ${habit.unit ?? ""}`.trimEnd() : ""}
                      </p>
                      <p className="font-heading text-meta text-text-muted">
                        {sameDays(habit.scheduleDays ?? EVERY_DAY, EVERY_DAY)
                          ? `${met} of ${scheduled} days`
                          : `${scheduleLabel(habit.scheduleDays)} · ${met} of ${scheduled}`}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 font-heading text-meta font-bold",
                        scheduled > 0 && met === scheduled ? "bg-success-tint text-success" : "bg-accent-tint text-accent-strong",
                      )}
                    >
                      {met}/{scheduled}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
            <p className="rounded-[20px] bg-accent-tint p-4 font-heading text-label text-text">
              Only scheduled days count. Unscheduled days are never &quot;missed&quot;.
            </p>
            <Link href={habitsHref("week", `week=${offset - 1}`)} scroll={false} className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable">
              Previous week
            </Link>
            {offset < 0 ? <SecondaryButton href={habitsHref("week", offset + 1 === 0 ? "" : `week=${offset + 1}`)}>Next week</SecondaryButton> : null}
          </>
        }
      />
    </>
  );
}

// ------------------------------------------------------------------ Month

export function MonthHabits({ tracker, habitId, monthOffset }: { tracker: HabitTracker; habitId: string | null; monthOffset: number }) {
  const today = new Date(`${tracker.todayIso}T12:00:00`);
  const shown = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1, 12);
  const cells = monthCells(shown.getFullYear(), shown.getMonth());
  const selected = tracker.habits.find((habit) => habit.id === habitId) ?? null;
  const pool = selected ? [selected] : tracker.habits;
  const past = cells.filter((iso): iso is string => Boolean(iso && iso <= tracker.todayIso));
  const scheduledSoFar = selected ? past.filter((iso) => scheduledOn(selected, iso)).length : 0;
  const metSoFar = selected ? past.filter((iso) => scheduledOn(selected, iso) && (tracker.history[selected.id]?.[iso] ?? 0) >= selected.targetCount).length : 0;
  const monthName = shown.toLocaleDateString("en-GB", { month: "long" });
  const query = (extra: Record<string, string | number | null>) =>
    Object.entries({ habit: habitId, month: monthOffset || null, ...extra })
      .filter(([, value]) => value !== null && value !== "" && value !== 0)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join("&");

  return (
    <>
      <SubHeader
        backHref="/habits"
        backLabel="Back to habits"
        kicker="Habits · Month"
        title={`${monthName} at a glance.`}
        subtitle={selected ? `${selected.name} · ${metSoFar} of ${scheduledSoFar} scheduled days so far` : "Each dot is one habit kept that day"}
      />
      <Split
        left={
          <div role="group" aria-label="Choose a habit" className="flex flex-wrap gap-2">
            <Link href={habitsHref("month", query({ habit: null }))} scroll={false}>
              <Pill selected={!selected}>All habits</Pill>
            </Link>
            {tracker.habits.map((habit) => (
              <Link key={habit.id} href={habitsHref("month", query({ habit: habit.id }))} scroll={false}>
                <Pill selected={selected?.id === habit.id}>{shortName(habit)}</Pill>
              </Link>
            ))}
          </div>
        }
        right={
          <>
            <Panel>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-heading font-extrabold text-text">
                  {monthName} {shown.getFullYear()}
                </h2>
                <span className="flex gap-4 font-heading text-heading font-bold text-accent-strong">
                  <Link href={habitsHref("month", query({ month: monthOffset - 1 }))} scroll={false} aria-label="Previous month">
                    ‹
                  </Link>
                  {monthOffset < 0 ? (
                    <Link href={habitsHref("month", query({ month: monthOffset + 1 }))} scroll={false} aria-label="Next month">
                      ›
                    </Link>
                  ) : (
                    <span aria-hidden className="opacity-30">
                      ›
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-y-2 text-center">
                {DAY_LETTER.map((letter, index) => (
                  <span key={index} className="font-heading text-meta text-text-muted">
                    {letter}
                  </span>
                ))}
                {cells.map((iso, index) => {
                  if (!iso) return <span key={`blank-${index}`} />;
                  const isToday = iso === tracker.todayIso;
                  const isPast = iso < tracker.todayIso;
                  const kept = pool.filter((habit) => scheduledOn(habit, iso) && (tracker.history[habit.id]?.[iso] ?? 0) >= habit.targetCount).length;
                  const day = Number(iso.slice(8));
                  const inner = (
                    <>
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-full font-heading text-body font-bold",
                          isToday ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : isPast ? "text-text-muted" : "text-text",
                        )}
                      >
                        {day}
                      </span>
                      <span aria-hidden className="flex h-1.5 justify-center gap-0.5">
                        {isPast || isToday
                          ? Array.from({ length: Math.min(4, kept) }, (_, dot) => <span key={dot} className="h-1.5 w-1.5 rounded-full bg-accent" />)
                          : null}
                      </span>
                    </>
                  );
                  return isPast ? (
                    <Link
                      key={iso}
                      href={habitsHref("day", `date=${iso}`)}
                      aria-label={`${weekdayDate(iso)}: ${kept} kept`}
                      className="flex flex-col items-center gap-0.5"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <span key={iso} className="flex flex-col items-center gap-0.5">
                      {inner}
                    </span>
                  );
                })}
              </div>
            </Panel>
            <section className="rounded-[22px] bg-success-tint p-4">
              <p className="font-heading text-body font-bold text-success">{selected ? `Dots are ${verbFor(selected)}` : "Dots are habits kept"}</p>
              <p className="mt-1 font-heading text-label text-text">Future days are never counted. No combined score across habits.</p>
            </section>
            <Link href="/habits" className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable">
              Back to today
            </Link>
          </>
        }
      />
    </>
  );
}

// ------------------------------------------------------------------ Day history

export function DayHabits({ tracker, iso }: { tracker: HabitTracker; iso: string }) {
  const scheduled = tracker.habits.filter((habit) => scheduledOn(habit, iso));
  const done = scheduled.filter((habit) => (tracker.history[habit.id]?.[iso] ?? 0) >= habit.targetCount).length;
  const weekday = new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });

  return (
    <>
      <SubHeader
        backHref={habitsHref("month")}
        backLabel="Back to month"
        kicker={`Habits · ${longDate(iso)}`}
        title="A day in your rhythm."
        subtitle={`${done} of ${scheduled.length} scheduled done`}
      />
      <Split
        left={
          <Panel>
            <ul className="divide-y divide-outline">
              {tracker.habits.map((habit) => {
                const isScheduled = scheduledOn(habit, iso);
                const count = tracker.history[habit.id]?.[iso] ?? 0;
                const met = count >= habit.targetCount;
                return (
                  <li key={habit.id} className="flex items-center gap-3 py-3">
                    {isScheduled ? (
                      <CheckOrb id={`day-${habit.id}`} size="sm" label={`${habit.name}: ${met ? "done" : "not done"}`} checked={met} disabled onChange={() => undefined} />
                    ) : (
                      <HabitIcon habit={habit} className="h-10 w-10" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-body font-bold text-text">{habit.name}</p>
                      <p className="font-heading text-meta text-text-muted">
                        {!isScheduled
                          ? `Not scheduled on ${weekday}s`
                          : met
                            ? habit.targetCount > 1
                              ? `${count} of ${habit.targetCount} ${habit.unit ?? ""}`.trimEnd()
                              : "Done"
                            : count > 0
                              ? `${count} of ${habit.targetCount} · that’s okay`
                              : "Not done · that’s okay"}
                      </p>
                    </div>
                    {!isScheduled ? <Badge tone="warm">Rest day</Badge> : null}
                  </li>
                );
              })}
            </ul>
          </Panel>
        }
        right={
          <p className="rounded-[20px] bg-accent-tint p-4 font-heading text-label text-text">
            Past days can’t be changed from here. History stays honest and kind.
          </p>
        }
      />
    </>
  );
}

// ------------------------------------------------------------------ All

export function AllHabits({ tracker }: { tracker: HabitTracker }) {
  return (
    <>
      <SubHeader backHref="/habits" backLabel="Back to habits" kicker="Habits · All" title="Everything you keep." subtitle={`${tracker.habits.length} habits`} />
      <Split
        left={<HabitTabs active="all" />}
        right={
          <>
            <Panel>
              <ul className="divide-y divide-outline">
                {tracker.habits.map((habit) => (
                  <li key={habit.id}>
                    <Link href={habitsHref("edit", `habit=${habit.id}`)} className="flex items-center gap-3 py-3">
                      <HabitIcon habit={habit} className="h-10 w-10" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-heading text-body font-bold text-text">{habit.name}</span>
                        <span className="block font-heading text-meta text-text-muted">
                          {scheduleLabel(habit.scheduleDays)}
                          {isPausedNow(habit, tracker.todayIso) ? " · paused" : ""}
                          {habit.shareWithSquad ? " · shared" : " · private"}
                        </span>
                      </span>
                      <ChevronRightIcon className="h-4 w-4 text-text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
            <Link href={habitsHref("new")} className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable">
              New habit
            </Link>
          </>
        }
      />
    </>
  );
}

// ------------------------------------------------------------------ New habit

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-8 w-14 shrink-0 rounded-full transition", checked ? "bg-[image:var(--gradient-primary)] shadow-pressable" : "bg-accent-tint shadow-inset")}
    >
      <span className={cn("absolute top-1 h-6 w-6 rounded-full bg-surface shadow-raised transition-all", checked ? "left-7" : "left-1")} />
    </button>
  );
}

function ChoiceRow<T extends string>({ legend, value, options, onChange }: { legend: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2 font-heading text-label font-bold text-text">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option.value} type="button" role="radio" aria-checked={option.value === value} onClick={() => onChange(option.value)}>
            <Pill selected={option.value === value}>{option.label}</Pill>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function DayPicker({ days, onChange }: { days: number[]; onChange: (days: number[]) => void }) {
  return (
    <div role="group" aria-label="Days" className="flex flex-wrap gap-2">
      {DAY_SHORT.map((label, day) => (
        <PillButton
          key={label}
          selected={days.includes(day)}
          onClick={() => onChange(days.includes(day) ? days.filter((item) => item !== day) : [...days, day].sort((a, b) => a - b))}
        >
          {label}
        </PillButton>
      ))}
    </div>
  );
}

type WhenChoice = "every" | "weekdays" | "pick";

export interface NewHabitValues {
  name: string;
  kind: HabitKind;
  targetCount: number;
  unit: string;
  scheduleDays: number[];
  reminderTime: string | null;
  goalName: string | null;
  shareWithSquad: boolean;
}

export function NewHabit({
  squadName,
  goals,
  initialName,
  onCreate,
}: {
  squadName: string;
  goals: string[];
  initialName: string;
  onCreate: (values: NewHabitValues) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [kind, setKind] = useState<HabitKind>("tick");
  const [target, setTarget] = useState("8");
  const [unit, setUnit] = useState("glasses");
  const [minutes, setMinutes] = useState("10");
  const [when, setWhen] = useState<WhenChoice>("every");
  const [days, setDays] = useState<number[]>([0, 2, 4]);
  const [reminderOn, setReminderOn] = useState(true);
  const [reminder, setReminder] = useState("07:30");
  const [goalIndex, setGoalIndex] = useState(0);
  const [share, setShare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const goalOptions = [...goals, "No goal"];

  async function submit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) return setError("Give it a short name first.");
    const scheduleDays = when === "every" ? EVERY_DAY : when === "weekdays" ? WEEKDAYS : days;
    if (scheduleDays.length === 0) return setError("Pick at least one day.");
    let targetCount = 1;
    if (kind === "target") {
      targetCount = Number(target);
      if (!Number.isInteger(targetCount) || targetCount < 2 || targetCount > 99) return setError("Targets are whole numbers from 2 to 99.");
    }
    if (kind === "timer") {
      targetCount = Number(minutes);
      if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > 240) return setError("Timers are 1 to 240 minutes.");
    }
    if (reminderOn && !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminder)) return setError("Reminder time looks off. Use HH:MM.");
    const goal = goalOptions[goalIndex];
    setSaving(true);
    try {
      await onCreate({
        name: trimmed.slice(0, 60),
        kind,
        targetCount,
        unit: kind === "target" ? unit.trim().slice(0, 20) || "times" : kind === "timer" ? "min" : "",
        scheduleDays,
        reminderTime: reminderOn ? reminder : null,
        goalName: goal === "No goal" ? null : goal,
        shareWithSquad: share,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SubHeader backHref="/habits" backLabel="Back to habits" kicker="New habit" title="A new rhythm." subtitle="Starts tomorrow. No history to live up to." />
      <form
        className="mt-5 grid gap-5 lg:grid-cols-2 lg:gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="flex flex-col gap-5">
          <label className="block">
            <span className="mb-2 block font-heading text-label font-bold text-text">Habit</span>
            <input
              value={name}
              maxLength={60}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="Mindful breathing"
              className="w-full rounded-[22px] bg-surface px-5 py-4 font-heading text-body text-text shadow-inset outline outline-2 outline-accent placeholder:text-text-muted"
            />
          </label>
          <ChoiceRow
            legend="Type"
            value={kind}
            onChange={setKind}
            options={[
              { value: "tick", label: "Just tick it" },
              { value: "target", label: "Target (e.g. 8 glasses)" },
              { value: "timer", label: "Timer" },
            ]}
          />
          {kind === "target" ? (
            <div className="-mt-2 flex items-center gap-2 font-heading text-label text-text-muted">
              <input inputMode="numeric" aria-label="Target" value={target} onChange={(event) => setTarget(event.target.value.replace(/\D/g, "").slice(0, 2))} className="w-16 rounded-full bg-surface px-4 py-2 text-text shadow-inset" />
              <input aria-label="Unit" value={unit} maxLength={20} onChange={(event) => setUnit(event.target.value)} className="w-32 rounded-full bg-surface px-4 py-2 text-text shadow-inset" />
              a day
            </div>
          ) : null}
          {kind === "timer" ? (
            <label className="-mt-2 flex items-center gap-2 font-heading text-label text-text-muted">
              <input inputMode="numeric" aria-label="Minutes" value={minutes} onChange={(event) => setMinutes(event.target.value.replace(/\D/g, "").slice(0, 3))} className="w-20 rounded-full bg-surface px-4 py-2 text-text shadow-inset" />
              minutes
            </label>
          ) : null}
          <ChoiceRow
            legend="When"
            value={when}
            onChange={setWhen}
            options={[
              { value: "every", label: "Every day" },
              { value: "weekdays", label: "Weekdays" },
              { value: "pick", label: "Pick days" },
            ]}
          />
          {when === "pick" ? <DayPicker days={days} onChange={setDays} /> : null}
        </div>
        <div className="flex flex-col gap-5">
          <Panel title="Options">
            <ul className="divide-y divide-outline">
              <li className="flex items-center justify-between gap-3 py-3">
                <span className="font-heading text-body font-bold text-text">
                  Reminder at{" "}
                  <input
                    type="time"
                    aria-label="Reminder time"
                    value={reminder}
                    disabled={!reminderOn}
                    onChange={(event) => setReminder(event.target.value)}
                    className="rounded-md bg-transparent font-bold text-text disabled:text-text-muted"
                  />
                </span>
                <Toggle checked={reminderOn} onChange={setReminderOn} label="Reminder" />
              </li>
              <li>
                <button type="button" onClick={() => setGoalIndex((index) => (index + 1) % goalOptions.length)} className="flex w-full items-center justify-between gap-3 py-3 text-left">
                  <span>
                    <span className="block font-heading text-body font-bold text-text">Link to a goal</span>
                    <span className="block font-heading text-meta text-text-muted">{goalOptions[goalIndex]}</span>
                  </span>
                  <ChevronRightIcon className="h-4 w-4 text-text-muted" />
                </button>
              </li>
              <li className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="block font-heading text-body font-bold text-text">Share with {squadName}</span>
                  <span className="block font-heading text-meta text-text-muted">Only &quot;done today&quot;</span>
                </span>
                <Toggle checked={share} onChange={setShare} label={`Share with ${squadName}`} />
              </li>
            </ul>
          </Panel>
          {error ? (
            <p role="alert" className="font-heading text-label text-warning">
              {error}
            </p>
          ) : null}
          <PrimaryButton type="submit" disabled={saving}>
            Create habit
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}

// ------------------------------------------------------------------ Edit schedule

export function EditHabit({
  habit,
  onSave,
  onArchive,
}: {
  habit: Habit;
  onSave: (days: number[], targetCount: number) => Promise<void>;
  onArchive: () => Promise<void>;
}) {
  const [days, setDays] = useState<number[]>(habit.scheduleDays ?? EVERY_DAY);
  const [target, setTarget] = useState(String(habit.targetCount));
  const [editingTarget, setEditingTarget] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unit = habit.kind === "timer" ? "minutes" : habit.unit ?? (habit.targetCount > 1 ? "times" : "time");

  async function save() {
    const value = Number(target);
    if (days.length === 0) return setError("Pick at least one day.");
    if (!Number.isInteger(value) || value < 1 || value > 240) return setError("Target is a whole number from 1 to 240.");
    await onSave(days, value);
  }

  return (
    <>
      <SubHeader
        backHref={habitsHref("all")}
        backLabel="Back to all habits"
        kicker={`Edit habit · ${habit.name}`}
        title="A rhythm that fits your life."
        subtitle="Your new schedule applies immediately. Past logs stay saved."
      />
      <Split
        left={
          <>
            <div>
              <p className="mb-2 font-heading text-label font-bold text-text">Days</p>
              <DayPicker
                days={days}
                onChange={(next) => {
                  setDays(next);
                  setError(null);
                }}
              />
            </div>
            <div>
              <p className="mb-2 font-heading text-label font-bold text-text">Target</p>
              <div className="flex items-center justify-between rounded-[22px] bg-surface px-5 py-4 shadow-raised">
                {editingTarget ? (
                  <label className="flex items-center gap-2 font-heading text-body text-text">
                    <input
                      inputMode="numeric"
                      aria-label="Target"
                      value={target}
                      onChange={(event) => setTarget(event.target.value.replace(/\D/g, "").slice(0, 3))}
                      className="w-16 rounded-full bg-accent-tint/50 px-3 py-1 shadow-inset"
                    />
                    {unit}
                  </label>
                ) : (
                  <span className="font-heading text-body text-text">
                    {target} {unit}
                  </span>
                )}
                <button type="button" onClick={() => setEditingTarget((value) => !value)} className="font-heading text-label font-bold text-accent-strong">
                  {editingTarget ? "Done" : "Change"}
                </button>
              </div>
            </div>
          </>
        }
        right={
          <>
            <Panel title="More">
              <ul className="divide-y divide-outline">
                <li>
                  <Link href={habitsHref("pause", `habit=${habit.id}`)} className="flex items-center gap-3 py-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">
                      <CalendarIcon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-heading text-body font-bold text-text">Pause this habit</span>
                      <span className="block font-heading text-meta text-text-muted">Paused days never count as missed</span>
                    </span>
                    <ChevronRightIcon className="h-4 w-4 text-text-muted" />
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={() => (confirmArchive ? void onArchive() : setConfirmArchive(true))} className="flex w-full items-center gap-3 py-3 text-left">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#fdeedd] text-[#9a5b12]">
                      <CheckIcon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-heading text-body font-bold text-text">{confirmArchive ? `Archive ${habit.name}?` : "Archive"}</span>
                      <span className="block font-heading text-meta text-text-muted">
                        {confirmArchive ? "Tap again to archive. Every past day stays in your history." : "Stops it and keeps all history"}
                      </span>
                    </span>
                    <ChevronRightIcon className="h-4 w-4 text-text-muted" />
                  </button>
                </li>
              </ul>
            </Panel>
            {error ? (
              <p role="alert" className="font-heading text-label text-warning">
                {error}
              </p>
            ) : null}
            <PrimaryButton onClick={() => void save()}>Save changes</PrimaryButton>
          </>
        }
      />
    </>
  );
}

// ------------------------------------------------------------------ Pause

export function PauseHabit({ habit, onPause, onCancel }: { habit: Habit; todayIso: string; onPause: (weeks: number | null) => Promise<void>; onCancel: () => void }) {
  const [length, setLength] = useState<"1" | "2" | "open">("1");
  return (
    <>
      <SubHeader
        backHref={habitsHref("edit", `habit=${habit.id}`)}
        backLabel="Back to edit"
        kicker={`Pause · ${habit.name}`}
        title="Room to pause."
        subtitle="Pause starts when you confirm. Existing logs stay saved."
      />
      <Split
        left={
          <ChoiceRow
            legend="For how long?"
            value={length}
            onChange={setLength}
            options={[
              { value: "1", label: "1 week" },
              { value: "2", label: "2 weeks" },
              { value: "open", label: "Until I resume" },
            ]}
          />
        }
        right={
          <>
            <section className="rounded-[22px] bg-success-tint p-4">
              <p className="font-heading text-body font-bold text-success">Nothing is lost</p>
              <p className="mt-1 font-heading text-label text-text">Today and all past days stay. Paused days won’t count as missed.</p>
            </section>
            <PrimaryButton onClick={() => void onPause(length === "open" ? null : Number(length))}>Pause habit</PrimaryButton>
            <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          </>
        }
      />
    </>
  );
}

// ------------------------------------------------------------------ Moment, empty, offline

export function MomentScreen({ moment, art, squadName, onDone, onShare }: { moment: ConsistencyMoment; art: StaticImageData; squadName: string; onDone: () => void; onShare: () => void }) {
  const [shared, setShared] = useState(false);
  return (
    <>
      <SubHeader backHref="/habits" backLabel="Back to habits" kicker="A rhythm worth noticing" title={`${moment.days} days of ${shortName({ id: moment.habitId, name: moment.habitName, targetCount: 1, completedCount: 0, isScheduledToday: true }).toLowerCase()}.`} subtitle={`${moment.habitName} · every scheduled day for ${moment.days === 14 ? "two weeks" : `${moment.days} days`}`} />
      <Split
        left={
          <AriTile art={art} label={`+${moment.xpAwarded} XP`} title="Ari feels it too." body="Not a streak to protect. Just a nice thing to notice.">
            <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">{shared ? `Shared with ${squadName}` : "Private"}</span>
          </AriTile>
        }
        right={
          <>
            <PrimaryButton onClick={onDone}>Nice!</PrimaryButton>
            {shared ? null : (
              <SecondaryButton
                onClick={() => {
                  setShared(true);
                  onShare();
                }}
              >
                Share with {squadName}
              </SecondaryButton>
            )}
          </>
        }
      />
    </>
  );
}

const STARTERS = ["Drink water", "Read 10 min", "Stretch 5 min", "Sleep on time"];

export function EmptyHabits({ art }: { art: StaticImageData }) {
  return (
    <>
      <SubHeader backHref="/home" backLabel="Back home" kicker="Habits" title="Your rhythm starts gently." subtitle="No habits yet, so there’s nothing to catch up on." />
      <Split
        left={<AriTile art={art} label="Pick one to start" title="Tiny habits grow best." body="Start with one. You can always add more later." />}
        right={
          <>
            <div>
              <p className="mb-2 font-heading text-label font-bold text-text">Popular first habits</p>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((starter) => (
                  <Link key={starter} href={habitsHref("new", `name=${encodeURIComponent(starter)}`)}>
                    <Pill selected={false}>{starter}</Pill>
                  </Link>
                ))}
              </div>
            </div>
            <Link href={habitsHref("new")} className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable">
              Create a habit
            </Link>
          </>
        }
      />
    </>
  );
}

export function OfflineHabits({ tracker, pending }: { tracker: HabitTracker; pending: Record<string, number> }) {
  const touched = tracker.habits.filter((habit) => pending[habit.id] || habit.completedCount > 0);
  const first = tracker.habits.find((habit) => pending[habit.id]);
  return (
    <>
      <SubHeader backHref="/habits" backLabel="Back to habits" kicker="Habits · Offline" title="Recorded here." subtitle="We’ll sync when you’re back online." />
      <Split
        left={
          <section role="status" className="rounded-[22px] bg-[#fdeedd] p-4">
            <p className="font-heading text-body font-bold text-[#9a5b12]">Not synced yet</p>
            <p className="mt-1 font-heading text-label text-text">
              {first
                ? `${shortName(first)} ${Math.min(first.targetCount, first.completedCount + (pending[first.id] ?? 0))} of ${first.targetCount} is saved on this device. Your squad sees it once it syncs.`
                : "Your logs are saved on this device. Your squad sees them once they sync."}
            </p>
          </section>
        }
        right={
          <Panel>
            <ul className="divide-y divide-outline">
              {touched.map((habit) => {
                const count = Math.min(habit.targetCount, habit.completedCount + (pending[habit.id] ?? 0));
                return (
                  <li key={habit.id} className="flex items-center gap-3 py-3">
                    <CheckOrb id={`offline-${habit.id}`} size="sm" label={habit.name} checked={count > 0} disabled onChange={() => undefined} />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-body font-bold text-text">{habit.name}</p>
                      <p className="font-heading text-meta text-text-muted">
                        {habit.targetCount > 1 ? `${count} of ${habit.targetCount} · ` : ""}
                        {pending[habit.id] ? "waiting to sync" : "Synced"}
                      </p>
                    </div>
                    {pending[habit.id] ? <Badge tone="warm">Pending</Badge> : <span className="rounded-full bg-success-tint px-3 py-1 font-heading text-meta font-bold text-success">Saved</span>}
                  </li>
                );
              })}
            </ul>
          </Panel>
        }
      />
    </>
  );
}

export function HabitsHeader({ todayIso }: { todayIso: string }) {
  const date = new Date(`${todayIso}T12:00:00`);
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="font-heading text-meta font-bold tracking-widest text-text-muted uppercase">
          Habits · {date.toLocaleDateString("en-GB", { weekday: "long" })} {date.getDate()}
        </p>
        <h1 className="mt-1 font-display text-display font-extrabold text-text">
          Small rituals, <br className="md:hidden" />
          kept gently.
        </h1>
      </div>
      <PlusButton href={habitsHref("new")} label="Add a habit" />
    </header>
  );
}

export function HabitsLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <Skeleton className="h-28 rounded-[28px]" />
      <Skeleton className="h-64 rounded-[28px]" />
    </div>
  );
}
