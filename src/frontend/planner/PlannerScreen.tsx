"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { useShell } from "../home/AppShell";
import { usePlanner, type UseTodayResult } from "../hooks";
import type { NewTaskInput, Task } from "../mocks/types";
import { AddTaskView } from "./AddTaskView";
import { monthLabel, weekOf } from "./dates";
import { GoalsView, SharedView, TasksView, WeekView } from "./ListViews";
import { BellButton, PlusButton, type PlannerView } from "./parts";
import { TaskDoneSheet } from "./TaskDoneSheet";
import { TodayView } from "./TodayView";

const VIEWS: PlannerView[] = ["today", "week", "tasks", "goals", "shared", "add"];

function readView(value: string | null): PlannerView {
  return VIEWS.includes(value as PlannerView) ? (value as PlannerView) : "today";
}

function subscribeMinute(callback: () => void) {
  const id = window.setInterval(callback, 60_000);
  return () => window.clearInterval(id);
}

function localIsoDate(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Today's local date as "YYYY-MM-DD"; a stable string, refreshed each minute so midnight rolls over. */
function useTodayIso(): string {
  return useSyncExternalStore(subscribeMinute, localIsoDate, localIsoDate);
}

interface Celebration {
  taskId: string;
  title: string;
  xpAwarded: number;
}

/** Figma 03 · Plan your day: Today, Week, Tasks, Goals, Shared, Add a task, Task done. */
export function PlannerScreen({ today }: { today: UseTodayResult }) {
  const params = useSearchParams();
  const router = useRouter();
  const { showToast, openQuickCreate } = useShell();
  const planner = usePlanner();
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  const view = readView(params.get("view"));
  const todayKey = useTodayIso();
  const now = useMemo(() => new Date(`${todayKey}T12:00:00`), [todayKey]);
  const week = useMemo(() => weekOf(now), [now]);
  const todayIso = week.find((day) => day.isToday)?.iso ?? week[0].iso;
  const requestedDay = params.get("day");
  const selectedIso = week.some((day) => day.iso === requestedDay) ? (requestedDay as string) : todayIso;

  const tasks = today.data?.tasks ?? null;
  const companion = today.data?.companion;
  const squadName = planner.data?.squadName ?? "your squad";

  async function toggle(task: Task) {
    if (task.isDone) {
      await today.undoCompleteTask(task.id);
      showToast(`“${task.title}” is open again.`);
      return;
    }
    const xpAwarded = await today.completeTask(task.id);
    setCelebration({ taskId: task.id, title: task.title, xpAwarded });
  }

  async function undoCelebration() {
    if (!celebration) return;
    await today.undoCompleteTask(celebration.taskId);
    setCelebration(null);
    showToast("Undone. It's back on today's list.");
  }

  async function addTask(input: NewTaskInput) {
    await today.addTask(input);
    await planner.reload();
    const isToday = (input.when ?? "today") === "today";
    showToast(isToday ? `Added “${input.title}” to today` : `Added “${input.title}” to your list`);
    router.push(isToday ? "/planner" : "/planner?view=tasks");
  }

  const doneCount = tasks?.filter((task) => task.isDone).length ?? 0;
  const nextTask = tasks?.find((task) => !task.isDone && task.id !== celebration?.taskId) ?? null;

  let body: ReactNode;
  if (view === "week") {
    body = <WeekView week={week} selectedIso={selectedIso} todayTasks={tasks} planner={planner.data} onToggleToday={(task) => void toggle(task)} />;
  } else if (view === "tasks") {
    body = (
      <TasksView
        planner={planner.data}
        onMove={(item) =>
          void planner.moveToToday(item.id).then((task) => {
            if (task) today.receiveTask(task);
            showToast(`“${item.title}” moved to today. No catching up needed.`);
          })
        }
      />
    );
  } else if (view === "goals") {
    body = <GoalsView planner={planner.data} onNewGoal={() => openQuickCreate("goal")} />;
  } else if (view === "shared") {
    body = <SharedView planner={planner.data} />;
  } else if (view === "add") {
    body = <AddTaskView squadName={squadName === "your squad" ? "My squad" : squadName} goals={planner.data?.goals ?? []} onAdd={addTask} onCancel={() => router.push("/planner")} />;
  } else {
    body = (
      <>
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="font-heading text-meta font-bold tracking-widest text-text-muted uppercase">Plan · {monthLabel(now)}</p>
            <h1 className="mt-1 font-display text-display font-extrabold text-text">
              Plan your day, <br className="md:hidden" />
              not your whole life.
            </h1>
          </div>
          <span className="md:hidden">
            <PlusButton href="/planner?view=add" />
          </span>
          <span className="hidden md:block">
            <BellButton />
          </span>
        </header>
        <TodayView
          week={week}
          todayIso={todayIso}
          tasks={tasks}
          planner={planner.data}
          onToggle={(task) => void toggle(task)}
          onMoveCarryOver={() =>
            void planner.moveCarryOverToToday().then((task) => {
              if (task) {
                today.receiveTask(task);
                showToast(`“${task.title}” is on today. No stress.`);
              }
            })
          }
          onPickCarryOverDay={() =>
            void planner.rescheduleCarryOver().then(() => {
              showToast("Moved to your list. Pick a day whenever you like.");
              router.push("/planner?view=tasks");
            })
          }
          onSuggestions={() => showToast("Suggested actions arrive with Growth Studio.")}
        />
      </>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pt-7 pb-36 sm:px-8 md:pt-10 md:pb-16">
      {body}
      <p role="status" className="mt-6 font-heading text-meta text-text-muted">
        Tasks and goals are saved to your account. XP and recurring schedules are not yet enabled.
      </p>
      {celebration && companion ? (
        <TaskDoneSheet
          open
          taskTitle={celebration.title}
          doneCount={doneCount}
          totalCount={tasks?.length ?? 0}
          xpAwarded={celebration.xpAwarded}
          stage={companion.stage}
          xp={companion.xp}
          xpToNextStage={companion.xpToNextStage}
          nextTaskTitle={nextTask?.title ?? null}
          onUndo={() => void undoCelebration()}
          onNext={() => setCelebration(null)}
          onClose={() => setCelebration(null)}
        />
      ) : null}
    </main>
  );
}
