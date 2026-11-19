"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import malikFace from "../assets/faces/malik-face.png";
import zaraFace from "../assets/faces/zara-face.png";
import { STAGE_ART } from "../companion";
import { CheckOrb, FaceAvatar, Skeleton } from "../components";
import { AriTile, HabitIcon, Split } from "../habits/views";
import { useShell } from "../home/AppShell";
import { GROWTH_STAGES, stageIndex } from "../home/growth";
import { ChevronRightIcon, MoveIcon, SparkleIcon } from "../home/icons";
import { useToday } from "../hooks";
import { cn } from "../lib/cn";
import { getAchievements, getGoalSnapshot, getProgress } from "../api/liveRepository";
import { cheerMoment, getSquadProgress } from "../mocks/repository";
import type { Achievement, GoalSnapshot, ProgressSummary, SquadProgress } from "../mocks/types";
import { BellButton, Panel, Pill, SubHeader } from "../planner/parts";
import { addDays, monthRangeLabel, rangeLabel, weekStart, hoursMinutes, signedMinutes } from "./format";

const FACES: Record<string, typeof zaraFace> = { Zara: zaraFace, Malik: malikFace };
type View = "dashboard" | "week" | "month" | "custom" | "goal" | "squad";
const VIEWS: View[] = ["dashboard", "week", "month", "custom", "goal", "squad"];

function subscribeMinute(callback: () => void) {
  const id = window.setInterval(callback, 60_000);
  return () => window.clearInterval(id);
}
function localIso(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function useTodayIso(): string {
  return useSyncExternalStore(subscribeMinute, localIso, localIso);
}

/** Load something when its key changes; the key keeps stale answers out. */
function useLoad<T>(key: string | null, load: () => Promise<T>): T | null {
  const [state, setState] = useState<{ key: string | null; value: T | null }>({ key: null, value: null });
  useEffect(() => {
    if (key === null) return;
    let alive = true;
    void load().then((value) => {
      if (alive) setState({ key, value });
    });
    return () => {
      alive = false;
    };
    // `load` is recreated every render; the key says when it really changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state.key === key ? state.value : null;
}

function Tile({ label, value, note, tone = "plain" }: { label?: string; value: string; note: string; tone?: "plain" | "kicker" }) {
  return (
    <div className="flex flex-1 flex-col rounded-[22px] bg-surface p-4 shadow-raised">
      {tone === "kicker" && label ? <span className="font-heading text-meta text-accent-strong uppercase">{label}</span> : null}
      <span className={cn("font-display font-extrabold text-text", tone === "kicker" ? "mt-1 text-heading" : "text-title text-center")}>{value}</span>
      <span className={cn("font-heading text-meta text-text-muted", tone === "kicker" ? "" : "text-center")}>{note}</span>
    </div>
  );
}

function PillLink({ href, selected, children }: { href: string; selected: boolean; children: ReactNode }) {
  return (
    <Link href={href} scroll={false} aria-current={selected ? "page" : undefined}>
      <Pill selected={selected}>{children}</Pill>
    </Link>
  );
}

const ACHIEVEMENT_TONES: Record<Achievement["tone"], string> = {
  gold: "bg-[radial-gradient(circle_at_35%_30%,#ffe2b0,#f4a259)]",
  violet: "bg-[radial-gradient(circle_at_35%_30%,#d9ccfb,#6b46c9)]",
  mint: "bg-[radial-gradient(circle_at_35%_30%,#dff5ec,#8fd3b8)]",
};

/** Figma 05 · Reflect & see progress. */
export function ProgressScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { showToast } = useShell();
  const today = useToday();
  const todayIso = useTodayIso();

  const rawView = params.get("view");
  const view: View = params.get("tab") === "squad" ? "squad" : VIEWS.includes(rawView as View) ? (rawView as View) : "dashboard";
  const monday = weekStart(todayIso);
  const monthStart = `${todayIso.slice(0, 8)}01`;
  const isoParam = (name: string) => {
    const value = params.get(name);
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  };
  const customFrom = isoParam("from") ?? addDays(todayIso, -14);
  const customTo = isoParam("to") ?? todayIso;

  const range =
    view === "month" ? [monthStart, todayIso] : view === "custom" ? [customFrom, customTo] : view === "dashboard" || view === "week" ? [monday, todayIso] : null;
  const summary = useLoad<ProgressSummary>(range ? range.join("|") : null, () => getProgress(range?.[0] ?? todayIso, range?.[1] ?? todayIso));
  const achievements = useLoad<Achievement[]>(view === "dashboard" ? "achievements" : null, getAchievements);
  const [squadKey, setSquadKey] = useState(0);
  const squad = useLoad<SquadProgress>(view === "squad" ? `squad-${squadKey}` : null, getSquadProgress);
  const goalId = params.get("goal");
  const snapshotResult = useLoad<{ snapshot: GoalSnapshot | null }>(view === "goal" && goalId ? `goal-${goalId}` : null, async () => ({
    snapshot: await getGoalSnapshot(goalId ?? ""),
  }));
  const snapshot = snapshotResult?.snapshot ?? null;

  const companion = today.data?.companion;
  const preview = params.get("preview");
  let body: ReactNode;

  // ---------------------------------------------------------------- squad
  if (view === "squad") {
    const noSquad = preview === "nosquad" || (squad && !squad.hasSquad);
    if (!squad && !noSquad) body = <Skeleton className="h-72 rounded-[28px]" />;
    else if (noSquad) {
      body = (
        <>
          <SubHeader backHref="/progress" backLabel="Back to progress" kicker="Progress · Squad" title="No squad yet." subtitle="Your personal progress is all here." />
          <Split
            left={
              <>
                <div className="flex gap-2">
                  <PillLink href="/progress" selected={false}>
                    Personal
                  </PillLink>
                  <PillLink href="/progress?tab=squad" selected>
                    Squad
                  </PillLink>
                </div>
                <AriTile art={STAGE_ART[companion?.stage ?? "teen"].full} label="Optional" title="Grow alongside friends?" body="Squads share check-ins and focus time, never your notes." />
              </>
            }
            right={
              <>
                <Link href="/squad?view=find" className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable">
                  Find your circle
                </Link>
                <Link href="/progress" className="w-full rounded-full bg-surface py-4 text-center font-heading text-body font-bold text-accent-strong shadow-raised">
                  Back to personal
                </Link>
              </>
            }
          />
        </>
      );
    } else if (squad) {
      body = (
        <>
          <SubHeader backHref="/progress" backLabel="Back to progress" kicker="Progress · Squad" title={`${squad.squadName} this week.`} subtitle="Together, not against each other." />
          <Split
            left={
              <>
                <div className="flex gap-2">
                  <PillLink href="/progress" selected={false}>
                    Personal
                  </PillLink>
                  <PillLink href="/progress?tab=squad" selected>
                    Squad
                  </PillLink>
                </div>
                <div className="flex gap-3">
                  <Tile value={`${squad.focusedHours}h`} note="focused together" />
                  <Tile value={String(squad.tasksDone)} note="tasks done" />
                  <Tile value={`${squad.checkedIn}/${squad.members}`} note="checked in" />
                </div>
                {squad.sharedGoal ? (
                  <Link href={`/goals/${squad.sharedGoal.id}`} className="block rounded-[24px] bg-surface p-5 shadow-raised">
                    <span className="flex items-baseline justify-between">
                      <span className="font-heading text-body font-bold text-text">Shared goal · {squad.sharedGoal.title}</span>
                      <span className="font-heading text-meta font-bold text-accent-strong">
                        {squad.sharedGoal.doneCount} / {squad.sharedGoal.totalCount}
                      </span>
                    </span>
                    <span className="mt-3 block h-2.5 rounded-full bg-accent-tint shadow-inset">
                      <span
                        className="block h-full rounded-full bg-[image:var(--gradient-primary)]"
                        style={{ width: `${Math.round((squad.sharedGoal.doneCount / Math.max(1, squad.sharedGoal.totalCount)) * 100)}%` }}
                      />
                    </span>
                  </Link>
                ) : null}
              </>
            }
            right={
              <>
                <Panel title="Moments">
                  <ul className="divide-y divide-outline">
                    {squad.moments.map((moment) => (
                      <li key={moment.id} className="flex items-center gap-3 py-3">
                        {moment.name === "You" && companion ? (
                          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-cream ring-[3px] ring-white">
                            <Image src={STAGE_ART[companion.stage].face} alt="Ari" width={40} height={40} className="h-full w-full object-cover" />
                          </span>
                        ) : (
                          <FaceAvatar name={moment.name} src={FACES[moment.name]} size={40} />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block font-heading text-body font-bold text-text">{moment.text}</span>
                          <span className="block font-heading text-meta text-text-muted">{moment.when}</span>
                        </span>
                        {moment.canCheer ? (
                          <button
                            type="button"
                            onClick={() =>
                              void cheerMoment(moment.id).then(() => {
                                showToast(`Cheer sent to ${moment.name}.`);
                                setSquadKey((key) => key + 1);
                              })
                            }
                            className="rounded-full bg-accent-tint px-3 py-1 font-heading text-meta font-bold text-accent-strong"
                          >
                            Cheer
                          </button>
                        ) : moment.name !== "You" ? (
                          <span className="font-heading text-meta text-success">Cheered</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Panel>
                <p className="rounded-[20px] bg-accent-tint p-4 font-heading text-label text-text">No rankings. Only what each person chose to share.</p>
              </>
            }
          />
        </>
      );
    }
  }
  // ---------------------------------------------------------------- goal snapshot
  else if (view === "goal") {
    if (!snapshotResult && goalId) {
      body = <Skeleton className="h-72 rounded-[28px]" />;
    } else if (!snapshot) {
      body = (
        <>
          <SubHeader backHref="/progress?view=custom" backLabel="Back to progress" kicker="Progress · Goal" title="We couldn’t find that goal." subtitle="Pick one from your custom range." />
        </>
      );
    } else {
      const percent = Math.round((snapshot.doneCount / Math.max(1, snapshot.totalCount)) * 100);
      body = (
        <>
          <SubHeader backHref="/progress?view=custom" backLabel="Back to progress" kicker="Progress · Goal" title={`${snapshot.title}.`} subtitle={`Started ${snapshot.startedOn} · ${snapshot.isShared ? "shared goal" : "personal goal"}`} />
          <Split
            left={
              <>
                <section className="rounded-[24px] bg-surface p-5 shadow-raised">
                  <div className="flex items-baseline justify-between">
                    <p className="font-heading text-body font-bold text-text">Linked tasks done</p>
                    <p className="font-heading text-meta font-bold text-accent-strong">
                      {snapshot.doneCount} / {snapshot.totalCount}
                    </p>
                  </div>
                  <div className="mt-3 h-2.5 rounded-full bg-accent-tint shadow-inset">
                    <span className="block h-full rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-2 font-heading text-meta text-text-muted">Not a grade. Just what’s moved.</p>
                </section>
                <div className="flex gap-3">
                  <Tile value={`${snapshot.focusHours}h`} note="focus" />
                  <Tile value={String(snapshot.areasActive)} note="areas active" />
                  <Tile value={String(snapshot.reviews)} note="reviews" />
                </div>
              </>
            }
            right={
              <>
                <Panel title="Recent">
                  <ul className="divide-y divide-outline">
                    {snapshot.recent.map((task) => (
                      <li key={task.id} className="flex items-center gap-3 py-3">
                        <CheckOrb id={`snap-${task.id}`} size="sm" label={task.title} checked={task.isDone} disabled onChange={() => undefined} />
                        <span>
                          <span className="block font-heading text-body font-bold text-text">{task.title}</span>
                          <span className="block font-heading text-meta text-text-muted">{task.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
                <Link href={`/goals/${snapshot.id}`} className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable">
                  Open Goal Details
                </Link>
                <Link href="/growth?view=grid" className="w-full rounded-full bg-surface py-4 text-center font-heading text-body font-bold text-accent-strong shadow-raised">
                  Open grid in Growth Studio
                </Link>
              </>
            }
          />
        </>
      );
    }
  }
  // ---------------------------------------------------------------- week / month / custom
  else if (view === "week" || view === "month" || view === "custom") {
    const rangePills = (
      <div className="flex flex-wrap gap-2">
        <PillLink href="/progress?view=week" selected={view === "week"}>
          Week
        </PillLink>
        <PillLink href="/progress?view=month" selected={view === "month"}>
          Month
        </PillLink>
        <PillLink href="/progress?view=custom" selected={view === "custom"}>
          Custom
        </PillLink>
      </div>
    );
    const monthName = new Date(`${todayIso}T12:00:00`).toLocaleDateString("en-GB", { month: "long" });
    body = (
      <>
        <SubHeader
          backHref="/progress"
          backLabel="Back to progress"
          kicker={view === "custom" ? "Progress · Custom" : "Progress · Personal"}
          title={view === "month" ? `${monthName} so far.` : view === "week" ? "This week so far." : "Pick any range."}
          subtitle={
            view === "custom"
              ? "Useful before a 15-day review."
              : `${view === "month" ? monthRangeLabel(monthStart, todayIso) : rangeLabel(monday, todayIso)} · compared with nothing but yourself.`
          }
        />
        <Split
          left={
            <>
              {view === "custom" ? null : (
                <div className="flex gap-2">
                  <PillLink href="/progress" selected>
                    Personal
                  </PillLink>
                  <PillLink href="/progress?tab=squad" selected={false}>
                    Squad
                  </PillLink>
                </div>
              )}
              {rangePills}
              {view === "custom" ? (
                <>
                  <DateField
                    label="From"
                    value={customFrom}
                    max={customTo}
                    onChange={(value) => router.replace(`/progress?view=custom&from=${value}&to=${customTo}`, { scroll: false })}
                  />
                  <DateField
                    label="To"
                    value={customTo}
                    min={customFrom}
                    max={todayIso}
                    onChange={(value) => router.replace(`/progress?view=custom&from=${customFrom}&to=${value}`, { scroll: false })}
                  />
                </>
              ) : null}
              {summary ? (
                <div className="flex gap-3">
                  <Tile value={String(summary.activeDays)} note="active days" />
                  <Tile value={hoursMinutes(summary.focusMinutes)} note="focused" />
                  <Tile value={String(summary.tasksDone)} note={view === "custom" ? "tasks" : "tasks done"} />
                </div>
              ) : (
                <Skeleton className="h-28 rounded-[22px]" />
              )}
            </>
          }
          right={
            summary ? (
              view === "custom" ? (
                <Panel title="By goal">
                  <ul className="divide-y divide-outline">
                    {summary.byGoal.map((goal) => (
                      <li key={goal.id}>
                        <Link href={`/progress?view=goal&goal=${goal.id}`} className="flex items-center gap-3 py-3">
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">
                            {goal.isPaused ? <MoveIcon className="h-5 w-5" /> : <SparkleIcon className="h-5 w-5" />}
                          </span>
                          <span className="flex-1">
                            <span className="block font-heading text-body font-bold text-text">{goal.title}</span>
                            <span className="block font-heading text-meta text-text-muted">
                              {goal.isPaused ? "Paused" : `${goal.tasksDone} tasks · ${hoursMinutes(goal.focusMinutes)} focus`}
                            </span>
                          </span>
                          <ChevronRightIcon className="h-4 w-4 text-text-muted" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : (
                <>
                  <Panel title={view === "month" ? "Habits this month" : "Habits this week"}>
                    <ul className="divide-y divide-outline">
                      {summary.habits
                        .filter((habit) => habit.scheduled > 0)
                        .map((habit) => (
                          <li key={habit.id} className="flex items-center gap-3 py-3">
                            <HabitIcon habit={{ id: habit.id, name: habit.name, icon: habit.icon, targetCount: 1, completedCount: 0, isScheduledToday: true }} className="h-10 w-10" />
                            <span className="flex-1">
                              <span className="block font-heading text-body font-bold text-text">{habit.name}</span>
                              <span className="block font-heading text-meta text-text-muted">
                                {habit.met} of {habit.scheduled} days
                              </span>
                            </span>
                            <span className="rounded-full bg-accent-tint px-3 py-1 font-heading text-meta font-bold text-accent-strong">
                              {Math.round((habit.met / habit.scheduled) * 100)}%
                            </span>
                          </li>
                        ))}
                    </ul>
                  </Panel>
                  {summary.bestWeek ? (
                    <section className="rounded-[22px] bg-success-tint p-4">
                      <p className="font-heading text-body font-bold text-success">Your best week was {rangeLabel(summary.bestWeek.from, summary.bestWeek.to)}</p>
                      <p className="mt-1 font-heading text-label text-text">{summary.bestWeek.activeDays} active days. Nothing to beat, just something to notice.</p>
                    </section>
                  ) : null}
                </>
              )
            ) : (
              <Skeleton className="h-64 rounded-[26px]" />
            )
          }
        />
      </>
    );
  }
  // ---------------------------------------------------------------- dashboard
  else {
    const currentIndex = companion ? stageIndex(companion.stage) : 2;
    const next = GROWTH_STAGES[currentIndex + 1];
    const toNext = companion?.xpToNextStage ? Math.max(0, companion.xpToNextStage - companion.xp) : null;
    const weekDays = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
    const minutesFor = (iso: string) => summary?.focusByDay.find((day) => day.iso === iso)?.minutes ?? 0;
    const maxMinutes = Math.max(60, ...weekDays.map(minutesFor));

    body = (
      <>
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="font-heading text-meta font-bold tracking-widest text-text-muted uppercase">Progress · {rangeLabel(monday, addDays(monday, 6), true)}</p>
            <h1 className="mt-1 font-display text-display font-extrabold text-text">
              {summary ? `${summary.activeDays} ${summary.activeDays === 1 ? "day" : "days"} showing up.` : "Your week so far."}
            </h1>
          </div>
          <span className="hidden md:block">
            <BellButton />
          </span>
        </header>
        <div className="mt-5 grid gap-5 lg:grid-cols-3 lg:items-start">
          <div className="flex flex-col gap-5">
            <nav aria-label="Progress views" className="flex rounded-full bg-accent-tint/70 p-1 shadow-inset">
              <span aria-current="page" className="flex-1 rounded-full bg-surface py-2.5 text-center font-heading text-label font-bold text-accent-strong shadow-raised">
                Me
              </span>
              <Link href="/progress?tab=squad" className="flex-1 py-2.5 text-center font-heading text-label font-bold text-text-muted">
                Squad
              </Link>
            </nav>
            <section aria-label="Growth journey" className="rounded-[28px] bg-[#f8f0e2] p-4 shadow-floating">
              <p className="font-heading text-meta tracking-wide text-accent-strong uppercase">Growth journey</p>
              <p className="font-heading text-body font-bold text-text">
                {GROWTH_STAGES[currentIndex]?.label}
                {next && toNext !== null ? ` · ${toNext.toLocaleString("en-GB")} XP to ${next.label}` : " · fully grown"}
              </p>
              <div className="mt-3 flex items-end justify-between px-1">
                {GROWTH_STAGES.map((stage, index) => (
                  <span key={stage.stage} className="relative flex flex-col items-center">
                    {index === currentIndex ? (
                      <span className="absolute -top-7 rounded-[10px] bg-[image:var(--gradient-primary)] px-2 py-0.5 font-heading text-meta font-bold text-white shadow-pressable">You</span>
                    ) : null}
                    <Image
                      src={STAGE_ART[stage.stage].full}
                      alt={index <= currentIndex ? `Ari as ${stage.label}` : `${stage.label}, still ahead`}
                      className={cn("w-auto", index > currentIndex ? "opacity-40 grayscale" : "")}
                      style={{ height: 70 + index * 14 }}
                    />
                  </span>
                ))}
              </div>
              <div className="relative mt-3 h-3">
                <span className="absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#e9e1f7]" />
                <span className="absolute top-1/2 left-2 h-1 -translate-y-1/2 rounded-full bg-accent" style={{ width: `calc(${(currentIndex / 4) * 100}% - 16px)` }} />
                <span className="absolute inset-x-2 flex justify-between">
                  {GROWTH_STAGES.map((stage, index) => (
                    <span key={stage.stage} className={cn("mt-0.5 h-2.5 w-2.5 rounded-full border-2", index <= currentIndex ? "border-white bg-accent" : "border-outline bg-surface")} />
                  ))}
                </span>
              </div>
              <div className="mt-2 flex justify-between font-heading text-meta text-text-muted">
                {GROWTH_STAGES.map((stage, index) => (
                  <span key={stage.stage} className={index === currentIndex ? "font-bold text-accent-strong" : ""}>
                    {stage.label}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-5">
            {summary ? (
              <div className="flex gap-3">
                <Tile
                  tone="kicker"
                  label="Focus"
                  value={hoursMinutes(summary.focusMinutes)}
                  note={summary.focusDeltaMinutes !== null ? `${signedMinutes(summary.focusDeltaMinutes)} vs last week` : "this week"}
                />
                <Tile tone="kicker" label="Tasks" value={String(summary.tasksDone)} note="done this week" />
                <Tile tone="kicker" label="Habits" value={`${summary.habitsKeptPercent}%`} note="kept" />
              </div>
            ) : (
              <Skeleton className="h-28 rounded-[22px]" />
            )}
            <section aria-labelledby="focus-by-day">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 id="focus-by-day" className="font-display text-heading font-extrabold text-text">
                    Focus by day
                  </h2>
                  <p className="font-heading text-label text-text-muted">Minutes of active focus</p>
                </div>
                <Link href="/progress?view=month" className="rounded-full bg-accent-tint px-4 py-2 font-heading text-label font-bold text-accent-strong">
                  Month
                </Link>
              </div>
              <div className="flex items-end justify-between gap-2 rounded-[26px] bg-surface p-5 shadow-raised">
                {weekDays.map((iso) => {
                  const minutes = minutesFor(iso);
                  const isToday = iso === todayIso;
                  const future = iso > todayIso;
                  const label = new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { weekday: "narrow" });
                  return (
                    <span key={iso} className="flex flex-1 flex-col items-center gap-2">
                      <span
                        className="relative flex h-32 w-full max-w-[28px] items-end overflow-hidden rounded-full bg-accent-tint shadow-inset"
                        role="img"
                        aria-label={`${new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" })}: ${future ? "still to come" : `${minutes} minutes`}`}
                      >
                        <span
                          className={cn("block w-full rounded-full", isToday ? "bg-[linear-gradient(180deg,#7b57d6,#4c319b)]" : "bg-[linear-gradient(180deg,#b9a3f0,#8a63e0)]")}
                          style={{ height: future ? 0 : `${Math.round((minutes / maxMinutes) * 100)}%` }}
                        />
                      </span>
                      <span className={cn("font-heading text-meta", isToday ? "font-bold text-text" : "text-text-muted")}>{label}</span>
                    </span>
                  );
                })}
              </div>
            </section>
          </div>

          <section aria-labelledby="achievements" className="flex flex-col">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 id="achievements" className="font-display text-heading font-extrabold text-text">
                  Achievements
                </h2>
                <p className="font-heading text-label text-text-muted">Earned for good. Never taken away.</p>
              </div>
              <Link href="/me?view=achievements" className="rounded-full bg-accent-tint px-4 py-2 font-heading text-label font-bold text-accent-strong">
                All
              </Link>
            </div>
            <ul className="flex justify-around rounded-[26px] bg-surface p-5 shadow-raised">
              {(achievements ?? []).slice(0, 3).map((item) => (
                <li key={item.id} className="flex flex-col items-center gap-2 text-center">
                  <span className={cn("grid h-16 w-16 place-items-center rounded-full text-white shadow-raised", ACHIEVEMENT_TONES[item.tone], item.earnedOn ? "" : "opacity-60")}>
                    <SparkleIcon className="h-6 w-6" />
                  </span>
                  <span className={cn("font-heading text-meta", item.earnedOn ? "text-text" : "text-text-muted")}>{item.title}</span>
                </li>
              ))}
            </ul>
            <Link href="/check-in" className="mt-5 flex items-center gap-3 rounded-[24px] bg-accent-tint p-4 shadow-raised">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-white shadow-pressable">
                <SparkleIcon className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-heading text-body font-bold text-text">How did today feel?</span>
                <span className="block font-heading text-meta text-text-muted">Two-minute check-in · no right answers</span>
              </span>
              <ChevronRightIcon className="h-4 w-4 text-text-muted" />
            </Link>
          </section>
        </div>
      </>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pt-7 pb-36 sm:px-8 md:pt-10 md:pb-16">
      {body}
      <p role="status" className="mt-6 font-heading text-meta text-text-muted">
        Your progress comes from your account. Squad totals are still examples.
      </p>
    </main>
  );
}

function DateField({ label, value, min, max, onChange }: { label: string; value: string; min?: string; max?: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block font-heading text-label font-bold text-text">{label}</span>
      <span className="flex items-center justify-between rounded-[22px] bg-surface px-5 py-3 shadow-raised">
        <input
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(event) => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) onChange(event.target.value);
          }}
          className="bg-transparent font-heading text-body text-text"
        />
        <span className="font-heading text-meta font-bold text-accent-strong">Change</span>
      </span>
    </label>
  );
}
