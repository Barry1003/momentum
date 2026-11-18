"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import malikFace from "../assets/faces/malik-face.png";
import zaraFace from "../assets/faces/zara-face.png";
import { CheckOrb, FaceAvatar, Skeleton } from "../components";
import { cn } from "../lib/cn";
import type { PlannerData, PlannerListTask, Task } from "../mocks/types";
import { dayHeading, monthLabel, weekRangeLabel, type WeekDay } from "./dates";
import { Badge, Panel, PillButton, PillTabs, SubHeader } from "./parts";

const FACES: Record<string, typeof zaraFace> = { Zara: zaraFace, Malik: malikFace };

function Row({
  id,
  title,
  detail,
  done,
  disabled,
  onToggle,
  trailing,
}: {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <CheckOrb id={`row-${id}`} size="sm" label={done ? `${title}, done` : `Complete ${title}`} checked={done} disabled={disabled} onChange={() => onToggle?.()} />
      <div className="min-w-0 flex-1">
        <p className={cn("font-heading text-body font-bold", done ? "text-text-muted" : "text-text")}>{title}</p>
        <p className="font-heading text-meta text-text-muted">{detail}</p>
      </div>
      {trailing}
    </li>
  );
}

/** Two columns on desktop: controls on the left, the list on the right. */
function Split({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
      <div className="flex flex-col gap-4">{left}</div>
      <div className="flex flex-col gap-4">{right}</div>
    </div>
  );
}

function todayDetail(task: Task): string {
  const parts = [task.time, task.durationMinutes ? `${task.durationMinutes} min` : null, task.category].filter(Boolean);
  return parts.join(" · ") || "Today";
}

// ---------------------------------------------------------------- Week

export function WeekView({
  week,
  selectedIso,
  todayTasks,
  planner,
  onToggleToday,
}: {
  week: WeekDay[];
  selectedIso: string;
  todayTasks: Task[] | null;
  planner: PlannerData | null;
  onToggleToday: (task: Task) => void;
}) {
  const today = week.find((day) => day.isToday);
  const selected = week.find((day) => day.iso === selectedIso) ?? today ?? week[0];
  const counts = (planner?.weekTaskCounts ?? []).map((count, index) =>
    week[index]?.isToday ? (todayTasks?.length ?? count) : count,
  );
  const total = counts.reduce((sum, count) => sum + count, 0);
  const otherDay = planner?.weekTasks[selected.index] ?? [];

  return (
    <>
      <SubHeader
        kicker="Plan · Week"
        title="This week, gently."
        subtitle={`${weekRangeLabel(week)} · ${total} tasks · ${planner?.habitsPerDay ?? 0} habits a day`}
      />
      <Split
        left={
          <>
            <PillTabs active="week" />
            <Panel title={monthLabel(new Date(`${selected.iso}T12:00:00`))}>
              <nav aria-label="Pick a day" className="mt-2 flex justify-between">
                {week.map((day) => {
                  const isSelected = day.iso === selected.iso;
                  return (
                    <Link
                      key={day.iso}
                      href={`/planner?view=week&day=${day.iso}`}
                      scroll={false}
                      aria-current={isSelected ? "date" : undefined}
                      className={cn(
                        "flex w-11 flex-col items-center gap-1 rounded-[16px] py-2 font-heading",
                        isSelected ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : "text-text",
                      )}
                    >
                      <span className={cn("text-meta", isSelected ? "text-white/85" : "text-text-muted")}>{day.dayLabel}</span>
                      <span className="text-heading font-bold">{day.dateLabel}</span>
                    </Link>
                  );
                })}
              </nav>
            </Panel>
          </>
        }
        right={
          <>
            <Panel title={dayHeading(selected.iso)}>
              {selected.isToday ? (
                todayTasks ? (
                  <ul className="divide-y divide-outline">
                    {todayTasks.map((task) => (
                      <Row
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        detail={todayDetail(task)}
                        done={task.isDone}
                        onToggle={() => onToggleToday(task)}
                        trailing={task.isShared ? <Badge>Shared</Badge> : null}
                      />
                    ))}
                  </ul>
                ) : (
                  <Skeleton className="h-40" />
                )
              ) : otherDay.length ? (
                <ul className="divide-y divide-outline">
                  {otherDay.map((task) => (
                    <Row
                      key={task.id}
                      id={task.id}
                      title={task.title}
                      detail={task.detail}
                      done={task.isDone}
                      disabled
                      trailing={task.isShared ? <Badge>Shared</Badge> : null}
                    />
                  ))}
                </ul>
              ) : (
                <p className="py-4 font-heading text-body text-text-muted">A free day. Rest is part of the plan.</p>
              )}
            </Panel>
            <p className="rounded-[20px] bg-accent-tint p-4 font-heading text-label text-text">
              Light days are fine. Tap a day to see or move its tasks.
            </p>
          </>
        }
      />
    </>
  );
}

// ---------------------------------------------------------------- Tasks

type TaskFilter = "open" | "done" | "shared" | "noDate";

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
  { value: "shared", label: "Shared" },
  { value: "noDate", label: "No date" },
];

const GROUPS: { value: PlannerListTask["group"]; label: string }[] = [
  { value: "overdue", label: "Overdue · No pressure" },
  { value: "thisWeek", label: "This week" },
  { value: "later", label: "Later" },
];

function matches(task: PlannerListTask, filter: TaskFilter): boolean {
  if (filter === "done") return task.isDone;
  if (task.isDone) return false;
  if (filter === "shared") return task.isShared;
  if (filter === "noDate") return !task.hasDate;
  return true;
}

export function TasksView({ planner, onMove }: { planner: PlannerData | null; onMove: (task: PlannerListTask) => void }) {
  const [filter, setFilter] = useState<TaskFilter>("open");
  const tasks = planner?.allTasks ?? [];
  const openCount = tasks.filter((task) => !task.isDone).length;
  const visible = tasks.filter((task) => matches(task, filter));

  return (
    <>
      <SubHeader kicker="Plan · Tasks" title="Everything on your list." subtitle={`${openCount} open · sorted by due date`} />
      <Split
        left={
          <>
            <PillTabs active="tasks" />
            <div role="group" aria-label="Filter tasks" className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <PillButton key={item.value} selected={filter === item.value} onClick={() => setFilter(item.value)}>
                  {item.label}
                </PillButton>
              ))}
            </div>
          </>
        }
        right={
          !planner ? (
            <Skeleton className="h-64 rounded-[26px]" />
          ) : visible.length === 0 ? (
            <Panel>
              <p className="py-2 font-heading text-body text-text-muted">Nothing here right now.</p>
            </Panel>
          ) : (
            GROUPS.map((group) => {
              const inGroup = visible.filter((task) => task.group === group.value);
              if (inGroup.length === 0) return null;
              return (
                <Panel key={group.value} title={group.label}>
                  <ul className="divide-y divide-outline">
                    {inGroup.map((task) => (
                      <Row
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        detail={task.detail}
                        done={task.isDone}
                        disabled
                        trailing={
                          task.badge === "Move" ? (
                            <button type="button" onClick={() => onMove(task)}>
                              <Badge tone="warm">Move</Badge>
                            </button>
                          ) : task.badge === "Shared" ? (
                            <Link href="/planner?view=shared">
                              <Badge>Shared</Badge>
                            </Link>
                          ) : task.badge ? (
                            <Badge>{task.badge}</Badge>
                          ) : null
                        }
                      />
                    ))}
                  </ul>
                </Panel>
              );
            })
          )
        }
      />
    </>
  );
}

// ---------------------------------------------------------------- Goals

export function GoalsView({ planner, onNewGoal }: { planner: PlannerData | null; onNewGoal: () => void }) {
  const goals = planner?.goals ?? [];
  const shared = goals.filter((goal) => goal.isShared).length;

  return (
    <>
      <SubHeader kicker="Plan · Goals" title="What you’re growing toward." subtitle={`${goals.length} goals · ${shared} shared`} />
      <Split
        left={<PillTabs active="goals" />}
        right={
          <>
            {!planner ? <Skeleton className="h-64 rounded-[26px]" /> : null}
            {goals.map((goal) => (
              <Link key={goal.id} href={`/goals/${goal.id}`} className="block rounded-[26px] bg-surface p-4 shadow-raised transition hover:shadow-floating">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-heading text-body font-bold text-text">{goal.title}</h2>
                  <span className="font-heading text-meta font-bold text-accent-strong">
                    {goal.isPaused ? "Paused" : `${goal.doneCount} / ${goal.totalCount}`}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${goal.title} progress`}
                  aria-valuemin={0}
                  aria-valuemax={goal.totalCount}
                  aria-valuenow={goal.doneCount}
                  className="mt-3 h-2.5 rounded-full bg-accent-tint shadow-inset"
                >
                  <span
                    className={cn("block h-full rounded-full bg-[image:var(--gradient-primary)]", goal.isPaused ? "opacity-70" : "")}
                    style={{ width: `${Math.round((goal.doneCount / Math.max(1, goal.totalCount)) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 font-heading text-meta text-text-muted">{goal.detail}</p>
              </Link>
            ))}
            <button
              type="button"
              onClick={onNewGoal}
              className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 font-heading text-body font-bold text-white shadow-pressable"
            >
              New goal
            </button>
          </>
        }
      />
    </>
  );
}

// ---------------------------------------------------------------- Shared

export function SharedView({ planner }: { planner: PlannerData | null }) {
  const squad = planner?.squadName ?? "your squad";
  return (
    <>
      <SubHeader kicker="Plan · Shared" title="What you said yes to." subtitle={`Tasks from ${squad} that are assigned to you`} />
      <Split
        left={
          !planner ? (
            <Skeleton className="h-40 rounded-[26px]" />
          ) : (
            <Panel>
              <ul className="divide-y divide-outline">
                {planner.shared.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <FaceAvatar name={item.assignedBy} src={FACES[item.assignedBy]} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-body font-bold text-text">{item.title}</p>
                      <p className="font-heading text-meta text-text-muted">
                        Assigned by {item.assignedBy} · {item.due}
                      </p>
                    </div>
                    <Badge>Shared</Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          )
        }
        right={
          <>
            <p className="rounded-[20px] bg-accent-tint p-4 font-heading text-label text-text">
              Your squad sees &quot;done&quot; or &quot;not yet&quot; for these. Your other tasks stay private.
            </p>
            <Link
              href={`/goals/${planner?.goals.find((goal) => goal.isShared)?.id ?? ""}`}
              className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable"
            >
              Open shared goal
            </Link>
          </>
        }
      />
    </>
  );
}
