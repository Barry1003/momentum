"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { STAGE_ART } from "../companion";
import { useShell } from "../home/AppShell";
import { useHabitTracker, usePlanner, useToday } from "../hooks";
import type { ConsistencyMoment, Habit } from "../mocks/types";
import {
  AllHabits,
  DayHabits,
  EditHabit,
  EmptyHabits,
  HabitsHeader,
  HabitsLoading,
  MomentScreen,
  MonthHabits,
  NewHabit,
  OfflineHabits,
  PauseHabit,
  TodayHabits,
  WeekHabits,
  habitsHref,
  type HabitsView,
} from "./views";

const VIEWS: HabitsView[] = ["today", "week", "month", "all", "day", "new", "edit", "pause"];

function readInt(value: string | null, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : 0;
}

/** Figma 03b · Habits, plus the habit states from 03d. */
export function HabitsScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { showToast } = useShell();
  const tracker = useHabitTracker();
  const planner = usePlanner();
  const today = useToday();
  const [moment, setMoment] = useState<ConsistencyMoment | null>(null);

  const rawView = params.get("view");
  const view: HabitsView = VIEWS.includes(rawView as HabitsView) ? (rawView as HabitsView) : "today";
  const preview = params.get("preview");
  const habitId = params.get("habit");
  const data = tracker.data;
  const stage = today.data?.companion.stage ?? "teen";
  const art = STAGE_ART[stage];
  const squadName = planner.data?.squadName ?? "your squad";
  const goals = (planner.data?.goals ?? []).filter((goal) => !goal.isPaused).map((goal) => goal.title).concat("Everyday wellbeing");

  async function log(habit: Habit) {
    try {
      const earned = await tracker.log(habit.id);
      if (earned) setMoment(earned);
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Unable to log habit.");
    }
  }

  let body: ReactNode;
  if (tracker.error) {
    body = <p role="alert" className="rounded-card bg-surface p-5 font-heading text-body text-warning">{tracker.error.message}</p>;
  } else if (!data) {
    body = <HabitsLoading />;
  } else if (moment) {
    body = (
      <MomentScreen
        moment={moment}
        art={art.full}
        squadName={squadName}
        onDone={() => setMoment(null)}
        onShare={() => showToast(`${squadName} will see “${moment.days} days” in the Squad Room.`)}
      />
    );
  } else if (preview === "empty" || (data.habits.length === 0 && view === "today")) {
    body = <EmptyHabits art={art.full} />;
  } else if (preview === "offline" || (tracker.isOffline && Object.keys(tracker.pending).length > 0 && view === "today")) {
    const pending = preview === "offline" ? { [data.habits[0]?.id ?? ""]: 4 } : tracker.pending;
    body = <OfflineHabits tracker={data} pending={pending} />;
  } else if (view === "week") {
    body = <WeekHabits tracker={data} offset={readInt(params.get("week"), -52, 0)} />;
  } else if (view === "month") {
    body = <MonthHabits tracker={data} habitId={habitId} monthOffset={readInt(params.get("month"), -24, 0)} />;
  } else if (view === "day") {
    const date = params.get("date");
    const valid = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && date < data.todayIso ? date : null;
    body = valid ? <DayHabits tracker={data} iso={valid} /> : <MonthHabits tracker={data} habitId={null} monthOffset={0} />;
  } else if (view === "all") {
    body = <AllHabits tracker={data} />;
  } else if (view === "new") {
    body = (
      <NewHabit
        squadName={squadName === "your squad" ? "my squad" : squadName}
        goals={goals}
        initialName={(params.get("name") ?? "").slice(0, 60)}
        onCreate={async (values) => {
          await tracker.create({ ...values, startsTomorrow: true });
          showToast(`“${values.name}” starts tomorrow.`);
          router.push("/habits");
        }}
      />
    );
  } else if (view === "edit" || view === "pause") {
    const habit = data.habits.find((item) => item.id === habitId);
    if (!habit) {
      body = <AllHabits tracker={data} />;
    } else if (view === "edit") {
      body = (
        <EditHabit
          key={habit.id}
          habit={habit}
          onSave={async (days, targetCount) => {
            await tracker.update(habit.id, { scheduleDays: days, targetCount });
            showToast("Saved. Changes start tomorrow.");
            router.push(habitsHref("all"));
          }}
          onArchive={async () => {
            await tracker.archive(habit.id);
            showToast(`“${habit.name}” archived. Its history stays.`);
            router.push(habitsHref("all"));
          }}
        />
      );
    } else {
      body = (
        <PauseHabit
          habit={habit}
          todayIso={data.todayIso}
          onPause={async (weeks) => {
            await tracker.pause(habit.id, weeks);
            showToast(`“${habit.name}” paused from tomorrow. Nothing is lost.`);
            router.push("/habits");
          }}
          onCancel={() => router.push(habitsHref("edit", `habit=${habit.id}`))}
        />
      );
    }
  } else {
    body = (
      <>
        <HabitsHeader todayIso={data.todayIso} />
        <TodayHabits
          tracker={data}
          face={art.face}
          pending={tracker.pending}
          onLog={(habit) => void log(habit)}
          onResume={(habit) =>
            void tracker.resume(habit.id).then(() => showToast(`“${habit.name}” is back from tomorrow.`))
          }
        />
      </>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pt-7 pb-36 sm:px-8 md:pt-10 md:pb-16">
      {body}
      <p role="status" className="mt-6 font-heading text-meta text-text-muted">
        Preview: habits, history and XP here are examples, not saved account data yet.
      </p>
    </main>
  );
}
