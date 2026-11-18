"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import malikFace from "../assets/faces/malik-face.png";
import zaraFace from "../assets/faces/zara-face.png";
import { STAGE_ART } from "../companion";
import { CheckOrb, FaceAvatar, Skeleton } from "../components";
import { AriTile, Split } from "../habits/views";
import { useShell } from "../home/AppShell";
import { CalendarIcon, CheckIcon, PlayIcon, SparkleIcon } from "../home/icons";
import { useGoal, useToday, type MilestoneResult } from "../hooks";
import { cn } from "../lib/cn";
import type { GoalActivity, GoalDetail, GoalMilestone, TaskPriority, TaskWhen } from "../mocks/types";
import { Badge, Panel, Pill, SubHeader, TaskCheck } from "../planner/parts";

type GoalView = "overview" | "tasks" | "milestones" | "activity" | "add" | "info" | "private";
const VIEWS: GoalView[] = ["overview", "tasks", "milestones", "activity", "add", "info", "private"];
const FACES: Record<string, typeof zaraFace> = { Zara: zaraFace, Malik: malikFace };

function goalHref(goalId: string, view: GoalView = "overview", extra = ""): string {
  const query = [view === "overview" ? "" : `view=${view}`, extra].filter(Boolean).join("&");
  return `/goals/${goalId}${query ? `?${query}` : ""}`;
}

function percentOf(goal: GoalDetail): number {
  return goal.totalCount ? Math.round((goal.doneCount / goal.totalCount) * 100) : 0;
}

function cheer(percent: number): string {
  if (percent >= 75) return "Nearly there!";
  if (percent >= 50) return "Halfway there!";
  if (percent >= 25) return "Building up!";
  return "Good start!";
}

function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable">
      {children}
    </Link>
  );
}

function PrimaryButton({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 font-heading text-body font-bold text-white shadow-pressable disabled:opacity-60">
      {children}
    </button>
  );
}

function SecondaryButton({ onClick, href, children }: { onClick?: () => void; href?: string; children: ReactNode }) {
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

function SubTabs({ goalId, active }: { goalId: string; active: GoalView }) {
  const tabs: { view: GoalView; label: string }[] = [
    { view: "tasks", label: "Tasks" },
    { view: "milestones", label: "Milestones" },
    { view: "activity", label: "Activity" },
  ];
  return (
    <nav aria-label="Goal views" className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link key={tab.view} href={goalHref(goalId, tab.view)} scroll={false} aria-current={tab.view === active ? "page" : undefined}>
          <Pill selected={tab.view === active}>{tab.label}</Pill>
        </Link>
      ))}
    </nav>
  );
}

function ActivityIcon({ kind }: { kind: GoalActivity["kind"] }) {
  const map = {
    task: { icon: <CheckIcon className="h-5 w-5" />, tone: "bg-success-tint text-success" },
    milestone: { icon: <SparkleIcon className="h-5 w-5" />, tone: "bg-accent-tint text-accent-strong" },
    focus: { icon: <PlayIcon className="h-5 w-5" />, tone: "bg-accent-tint text-accent-strong" },
    added: { icon: <CalendarIcon className="h-5 w-5" />, tone: "bg-accent-tint text-accent-strong" },
  }[kind];
  return <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", map.tone)}>{map.icon}</span>;
}

function MilestonePath({ milestones }: { milestones: GoalMilestone[] }) {
  return (
    <ol className="flex flex-col">
      {milestones.map((milestone, index) => {
        const last = index === milestones.length - 1;
        const done = milestone.criteria.filter((item) => item.done).length;
        return (
          <li key={milestone.id} className="flex gap-4">
            <span className="flex flex-col items-center">
              <span
                className={cn(
                  "h-7 w-7 shrink-0 rounded-full",
                  milestone.status === "reached" && "bg-[radial-gradient(circle_at_35%_30%,#b9a3f0,#5a3fb0)] shadow-pressable",
                  milestone.status === "current" && "border-[3px] border-accent bg-surface",
                  milestone.status === "later" && "bg-accent-tint",
                )}
              />
              {last ? null : <span className={cn("w-1 flex-1", milestone.status === "reached" ? "bg-accent" : "bg-accent-tint")} />}
            </span>
            <span className="pb-5">
              <span className={cn("block font-heading text-body font-bold", milestone.status === "later" ? "text-text-muted" : "text-text")}>{milestone.title}</span>
              <span className={cn("block font-heading text-meta", milestone.status === "current" ? "text-accent-strong" : "text-text-muted")}>
                {milestone.status === "reached"
                  ? `Done · ${milestone.reachedOn}`
                  : milestone.status === "current"
                    ? `${done} of ${milestone.criteria.length} steps · in progress`
                    : "Next"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function WhyCard({ goal }: { goal: GoalDetail }) {
  if (!goal.why) return null;
  return (
    <section className="rounded-[24px] bg-surface p-5 shadow-raised">
      <p className="font-heading text-meta tracking-wide text-accent-strong uppercase">Why it matters</p>
      <p className="mt-2 font-heading text-heading text-text">“{goal.why}”</p>
    </section>
  );
}

// ------------------------------------------------------------------ screen

/** Figma 03c · Goals, and the goal states from 03d. */
export function GoalScreen({ goalId }: { goalId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const { showToast, openQuickCreate } = useShell();
  const today = useToday();
  const { goal, isLoading, notFound, completeTask, addTask, toggleCriterion, confirmMilestone } = useGoal(goalId);
  const [celebration, setCelebration] = useState<MilestoneResult | null>(null);
  const [showGoalReached, setShowGoalReached] = useState(false);

  const raw = params.get("view");
  const view: GoalView = VIEWS.includes(raw as GoalView) ? (raw as GoalView) : "overview";
  const art = STAGE_ART[today.data?.companion.stage ?? "teen"];

  if (isLoading) {
    return (
      <Shell>
        <Skeleton className="h-72 rounded-[28px]" />
      </Shell>
    );
  }
  if (notFound || !goal) {
    return (
      <Shell>
        <SubHeader backHref="/planner?view=goals" backLabel="Back to goals" kicker="Plan · Goals" title="We couldn’t find that goal." subtitle="It may have been removed, or the link is old." />
        <div className="mt-5 max-w-md">
          <PrimaryLink href="/planner?view=goals">See your goals</PrimaryLink>
        </div>
      </Shell>
    );
  }

  const percent = percentOf(goal);
  const reachedCount = goal.milestones.filter((milestone) => milestone.status === "reached").length;
  const current = goal.milestones.find((milestone) => milestone.status === "current") ?? null;
  const squad = goal.squadName ?? "your squad";

  async function finishTask(taskId: string) {
    const xp = await completeTask(taskId);
    if (xp) showToast(`Nice. +${xp} XP for Ari.`);
  }

  // Milestone and goal celebrations take over the screen until dismissed.
  if (showGoalReached || (goal.completedOn && params.get("preview") === "reached")) {
    return (
      <Shell>
        <SubHeader backHref="/planner?view=goals" backLabel="Back to goals" kicker="Goal reached" title="You reached your goal." subtitle={`${goal.title} · ${goal.startedOn} – ${goal.completedOn ?? "today"}`} />
        <Split
          left={
            <AriTile art={art.full} label={celebration?.goalReachedXp ? `+${celebration.goalReachedXp} XP` : "Goal reached"} title="This one’s yours forever." body={`${goal.doneCount} tasks, ${goal.milestones.length} milestones, ${goal.focusHours} hours of focus.`}>
              <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">Completed</span>
            </AriTile>
          }
          right={
            <>
              <div className="flex gap-3">
                {[
                  [String(goal.doneCount), "tasks"],
                  [String(goal.milestones.length), "milestones"],
                  [`${goal.focusHours}h`, "focus"],
                ].map(([value, label]) => (
                  <div key={label} className="flex flex-1 flex-col items-center rounded-[22px] bg-surface py-5 shadow-raised">
                    <span className="font-display text-title font-extrabold text-text">{value}</span>
                    <span className="font-heading text-meta text-text-muted">{label}</span>
                  </div>
                ))}
              </div>
              <PrimaryButton
                onClick={() => {
                  setShowGoalReached(false);
                  setCelebration(null);
                  router.push(goalHref(goal.id, "activity"));
                }}
              >
                View the journey
              </PrimaryButton>
              <SecondaryButton onClick={() => openQuickCreate("goal")}>Start a new goal</SecondaryButton>
            </>
          }
        />
      </Shell>
    );
  }

  if (celebration) {
    return (
      <Shell>
        <SubHeader backHref={goalHref(goal.id)} backLabel="Back to goal" kicker="Milestone reached" title="Look how far you’ve come." subtitle={`${celebration.title} · ${reachedCount} of ${goal.milestones.length} milestones`} />
        <Split
          left={
            <AriTile art={art.full} label={`+${celebration.xpAwarded} XP`} title={celebration.title} body="You confirmed it, so it counts. History is kept forever.">
              <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">{goal.isShared ? `Shared with ${squad}` : "Private"}</span>
            </AriTile>
          }
          right={
            <>
              <PrimaryButton
                onClick={() => {
                  if (celebration.goalReachedXp) {
                    setShowGoalReached(true);
                    return;
                  }
                  setCelebration(null);
                  router.push(goalHref(goal.id, "milestones"));
                }}
              >
                {celebration.goalReachedXp ? "See the whole goal" : "Continue to next milestone"}
              </PrimaryButton>
              {goal.isShared ? null : (
                <SecondaryButton onClick={() => showToast("Sharing a personal milestone arrives with Squad settings.")}>Share with your squad</SecondaryButton>
              )}
            </>
          }
        />
      </Shell>
    );
  }

  const fresh = goal.tasks.length === 0 && goal.milestones.length === 0;

  let body: ReactNode;
  if (view === "private") {
    const task = goal.tasks.find((item) => item.id === params.get("task") && item.isPrivate);
    body = (
      <>
        <SubHeader backHref={goalHref(goal.id)} backLabel="Back to shared goal" kicker="Shared goal · Task" title="This task is private." subtitle={goal.title} />
        <Split
          left={
            <section className="rounded-[22px] bg-accent-tint p-4">
              <p className="font-heading text-body font-bold text-accent-strong">{task?.assignee ?? "A teammate"} kept this one private</p>
              <p className="mt-1 font-heading text-label text-text">
                You can see it exists and counts toward the goal. Its name and notes stay with {task?.assignee ?? "them"}.
              </p>
            </section>
          }
          right={<PrimaryLink href={goalHref(goal.id)}>Back to shared goal</PrimaryLink>}
        />
      </>
    );
  } else if (view === "add") {
    body = (
      <AddGoalTask
        goal={goal}
        onCancel={() => router.push(goalHref(goal.id))}
        onSave={async (input) => {
          await addTask(input);
          showToast(`“${input.title}” added to ${goal.title}.`);
          router.push(goalHref(goal.id));
        }}
      />
    );
  } else if (view === "activity") {
    body = (
      <>
        <SubHeader backHref={goalHref(goal.id)} backLabel="Back to goal" kicker="Goal · Activity" title="What’s moved lately." subtitle={goal.title} />
        <Split
          left={<SubTabs goalId={goal.id} active="activity" />}
          right={
            <>
              <Panel>
                {goal.activity.length === 0 ? (
                  <p className="py-3 font-heading text-body text-text-muted">Nothing yet. The first step will show here.</p>
                ) : (
                  <ul className="divide-y divide-outline">
                    {goal.activity.map((item) => (
                      <li key={item.id} className="flex items-center gap-3 py-3">
                        <ActivityIcon kind={item.kind} />
                        <span>
                          <span className="block font-heading text-body font-bold text-text">{item.text}</span>
                          <span className="block font-heading text-meta text-text-muted">{item.when}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
              <p className="rounded-[20px] bg-accent-tint p-4 font-heading text-label text-text">
                {goal.isShared ? `${squad} sees this list. Private tasks never show by name.` : "Only you see this list for personal goals."}
              </p>
            </>
          }
        />
      </>
    );
  } else if (view === "milestones") {
    const met = current ? current.criteria.filter((item) => item.done).length : 0;
    body = (
      <>
        <SubHeader
          backHref={goalHref(goal.id)}
          backLabel="Back to goal"
          kicker="Goal · Milestones"
          title="Bigger steps along the way."
          subtitle={`${goal.title} · ${reachedCount} of ${goal.milestones.length} reached`}
        />
        <Split
          left={
            <>
              <SubTabs goalId={goal.id} active="milestones" />
              <Panel>
                <ul className="divide-y divide-outline">
                  {goal.milestones.map((milestone) => {
                    const done = milestone.criteria.filter((item) => item.done).length;
                    const ready = milestone.status === "current" && milestone.criteria.length > 0 && done >= Math.ceil(milestone.criteria.length / 2);
                    return (
                      <li key={milestone.id} className="flex items-center gap-3 py-3">
                        <CheckOrb id={`ms-${milestone.id}`} size="sm" label={milestone.title} checked={milestone.status === "reached"} disabled onChange={() => undefined} />
                        <div className="min-w-0 flex-1">
                          <p className="font-heading text-body font-bold text-text">{milestone.title}</p>
                          <p className="font-heading text-meta text-text-muted">
                            {milestone.status === "reached"
                              ? `Reached ${milestone.reachedOn}`
                              : milestone.status === "current"
                                ? `${done} of ${milestone.criteria.length} criteria met`
                                : "Upcoming"}
                          </p>
                        </div>
                        {milestone.status === "reached" ? (
                          <span className="rounded-full bg-success-tint px-3 py-1 font-heading text-meta font-bold text-success">Reached</span>
                        ) : milestone.status === "current" ? (
                          <Badge>{ready ? "Ready to confirm" : "In progress"}</Badge>
                        ) : (
                          <Badge tone="warm">Later</Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </>
          }
          right={
            current ? (
              <>
                <Panel title={`${current.title} · Criteria`}>
                  <ul className="divide-y divide-outline">
                    {current.criteria.map((criterion) => (
                      <li key={criterion.id} className="flex items-center gap-3 py-3">
                        <CheckOrb
                          id={`crit-${criterion.id}`}
                          size="sm"
                          label={criterion.label}
                          checked={criterion.done}
                          onChange={() => void toggleCriterion(current.id, criterion.id)}
                        />
                        <span className="font-heading text-body font-bold text-text">{criterion.label}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
                <p className="font-heading text-meta text-text-muted">
                  {met === current.criteria.length ? "Every step is met." : `${met} of ${current.criteria.length} met. You decide when it counts.`}
                </p>
                <PrimaryButton
                  onClick={() =>
                    void confirmMilestone(current.id).then((result) => {
                      if (result) setCelebration(result);
                    })
                  }
                >
                  Mark milestone reached
                </PrimaryButton>
                <SecondaryButton href={goalHref(goal.id)}>Not yet</SecondaryButton>
              </>
            ) : (
              <p className="rounded-[20px] bg-success-tint p-4 font-heading text-label text-text">Every milestone is reached. That’s the whole path.</p>
            )
          }
        />
      </>
    );
  } else if (view === "tasks") {
    body = (
      <>
        <SubHeader backHref={goalHref(goal.id)} backLabel="Back to goal" kicker="Goal · Tasks" title="Small steps toward it." subtitle={`${goal.title} · ${goal.doneCount} of ${goal.totalCount} done`} />
        <Split
          left={<SubTabs goalId={goal.id} active="tasks" />}
          right={
            <>
              <TaskList goal={goal} onComplete={(id) => void finishTask(id)} />
              <PrimaryLink href={goalHref(goal.id, "add")}>Add a linked task</PrimaryLink>
            </>
          }
        />
      </>
    );
  } else if (fresh) {
    body = (
      <>
        <SubHeader backHref="/planner?view=goals" backLabel="Back to goals" kicker="Plan · Goals" title="A fresh beginning." subtitle={`${goal.title} · not started`} />
        <Split
          left={<AriTile art={art.full} label="No tasks yet" title="A new goal starts with one step." body="What’s the smallest thing that moves it forward?" />}
          right={
            <>
              <PrimaryLink href={goalHref(goal.id, "add")}>Add the first task</PrimaryLink>
              <SecondaryButton onClick={() => showToast("Growth Studio planning arrives with section 06.")}>Plan it in Growth Studio</SecondaryButton>
            </>
          }
        />
      </>
    );
  } else if (goal.isShared && view !== "info") {
    const mine = goal.tasks.filter((task) => task.assignee === "You");
    const privateTasks = goal.tasks.filter((task) => task.isPrivate);
    body = (
      <>
        <SubHeader backHref="/planner?view=goals" backLabel="Back to goals" kicker="Plan · Goals · Shared" title={`${goal.title}.`} subtitle={`${squad} · target ${goal.targetLabel}`} />
        <Split
          left={
            <>
              <section className="rounded-[24px] bg-surface p-5 shadow-raised">
                <div className="flex items-baseline justify-between">
                  <p className="font-heading text-body font-bold text-text">Together</p>
                  <p className="font-heading text-meta font-bold text-accent-strong">
                    {goal.doneCount} / {goal.totalCount} tasks
                  </p>
                </div>
                <div className="mt-3 h-3 rounded-full bg-accent-tint shadow-inset" role="progressbar" aria-label="Shared goal progress" aria-valuemin={0} aria-valuemax={goal.totalCount} aria-valuenow={goal.doneCount}>
                  <span className="block h-full rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-2 font-heading text-meta text-text-muted">Assigned work and contribution counts only. Private tasks never show.</p>
                {privateTasks.map((task) => (
                  <Link key={task.id} href={goalHref(goal.id, "private", `task=${task.id}`)} className="mt-2 block font-heading text-meta font-bold text-accent-strong">
                    1 private task from {task.assignee} →
                  </Link>
                ))}
              </section>
              <Panel title="Assigned to you">
                <ul className="divide-y divide-outline">
                  {mine.map((task) => (
                    <li key={task.id} className="flex items-center gap-3 py-3">
                      <CheckOrb id={`mine-${task.id}`} size="sm" label={task.isDone ? `${task.title}, done` : `Complete ${task.title}`} checked={task.isDone} disabled={task.isDone} onChange={() => void finishTask(task.id)} />
                      <span>
                        <span className="block font-heading text-body font-bold text-text">{task.title}</span>
                        <span className="block font-heading text-meta text-text-muted">{task.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          }
          right={
            <>
              <Panel title="Who’s contributing">
                <ul className="divide-y divide-outline">
                  {goal.contributors.map((person) => (
                    <li key={person.name} className="flex items-center gap-3 py-3">
                      {person.isYou ? (
                        <span className="h-9 w-9 overflow-hidden rounded-full bg-cream shadow-raised ring-[3px] ring-white">
                          <Image src={art.face} alt="You" width={36} height={36} className="h-full w-full object-cover" />
                        </span>
                      ) : (
                        <FaceAvatar name={person.name} src={FACES[person.name]} size={36} />
                      )}
                      <span>
                        <span className="block font-heading text-body font-bold text-text">{person.name}</span>
                        <span className="block font-heading text-meta text-text-muted">
                          {person.doneCount} done{person.isOwner ? " · owner" : ""}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <PrimaryLink href={goalHref(goal.id, "add")}>Add a linked task</PrimaryLink>
              <SecondaryButton href={goalHref(goal.id, "info")}>Goal info</SecondaryButton>
            </>
          }
        />
      </>
    );
  } else {
    const openThisWeek = goal.tasks.filter((task) => !task.isDone).length;
    body = (
      <>
        <header>
          <p className="font-heading text-meta font-bold tracking-widest text-text-muted uppercase">
            <Link href="/planner?view=goals" className="hover:underline">
              Plan · Goals
            </Link>
          </p>
          <h1 className="mt-1 font-display text-display font-extrabold text-text">{goal.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-surface px-3 py-1.5 font-heading text-meta font-bold text-accent-strong shadow-raised">
              {goal.isShared ? `${squad} · Shared` : "Personal · Private"}
            </span>
            <span className="rounded-full bg-surface px-3 py-1.5 font-heading text-meta text-text-muted shadow-raised">
              {goal.targetLabel === "no target" ? "No target date" : `Target · ${goal.targetLabel}`}
            </span>
            {goal.isPaused ? <Badge tone="warm">Paused</Badge> : null}
          </div>
        </header>
        <Split
          left={
            <>
              <section className="relative flex items-stretch overflow-hidden rounded-[28px] bg-[#f8f0e2] shadow-floating">
                <div className="flex flex-1 flex-col justify-center gap-3 p-5">
                  <span
                    className="grid h-32 w-32 place-items-center rounded-full"
                    style={{ background: `conic-gradient(var(--color-accent) ${percent * 3.6}deg, #e9e1f7 0)` }}
                    role="img"
                    aria-label={`${percent}% of tasks done`}
                  >
                    <span className="grid h-24 w-24 place-items-center rounded-full bg-[radial-gradient(circle_at_40%_30%,#ffffff,#efe9f8)] font-display text-title font-extrabold text-text shadow-raised">
                      {percent}%
                    </span>
                  </span>
                  <div>
                    <p className="font-heading text-body font-bold text-text">
                      {reachedCount} of {goal.milestones.length} milestones
                    </p>
                    <p className="font-heading text-meta text-text-muted">
                      {openThisWeek} {openThisWeek === 1 ? "task" : "tasks"} open{goal.isPaused ? " · paused" : " · on track"}
                    </p>
                  </div>
                </div>
                <div className="relative w-[120px] shrink-0">
                  <span className="absolute top-4 right-16 z-10 w-max rounded-[14px] rounded-br-sm bg-surface px-3 py-1.5 font-heading text-meta text-text shadow-raised">
                    {cheer(percent)}
                  </span>
                  <Image src={art.full} alt="Ari" fill sizes="120px" className="object-contain object-bottom pt-10" />
                </div>
              </section>
              <nav aria-label="Goal views" className="flex rounded-full bg-accent-tint/70 p-1 shadow-inset">
                {(["overview", "tasks", "milestones", "activity"] as GoalView[]).map((tab) => (
                  <Link
                    key={tab}
                    href={goalHref(goal.id, tab)}
                    scroll={false}
                    aria-current={tab === "overview" ? "page" : undefined}
                    className={cn(
                      "flex-1 rounded-full py-2.5 text-center font-heading text-label font-bold capitalize",
                      tab === "overview" ? "bg-surface text-accent-strong shadow-raised" : "text-text-muted",
                    )}
                  >
                    {tab}
                  </Link>
                ))}
              </nav>
              <WhyCard goal={goal} />
            </>
          }
          right={
            <>
              <section>
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <h2 className="font-display text-heading font-extrabold text-text">Milestone path</h2>
                    <p className="font-heading text-label text-text-muted">The next step is lit up.</p>
                  </div>
                  <Link href={goalHref(goal.id, "milestones")} className="rounded-full bg-accent-tint px-4 py-2 font-heading text-label font-bold text-accent-strong">
                    All
                  </Link>
                </div>
                <Panel>
                  <MilestonePath milestones={goal.milestones} />
                </Panel>
              </section>
              {view === "info" ? null : (
                <section>
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <h2 className="font-display text-heading font-extrabold text-text">Linked tasks</h2>
                      <p className="font-heading text-label text-text-muted">Finishing these moves the ring.</p>
                    </div>
                    <Link href={goalHref(goal.id, "add")} className="rounded-full bg-accent-tint px-4 py-2 font-heading text-label font-bold text-accent-strong">
                      + Task
                    </Link>
                  </div>
                  <TaskList goal={goal} onComplete={(id) => void finishTask(id)} />
                </section>
              )}
              {goal.linkedHabit ? (
                <Link href="/habits" className="flex items-center gap-3 rounded-[24px] bg-accent-tint p-4 shadow-raised">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-white shadow-pressable">
                    <SparkleIcon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-heading text-body font-bold text-text">{goal.linkedHabit.name}</span>
                    <span className="block font-heading text-meta text-text-muted">{goal.linkedHabit.detail}</span>
                  </span>
                </Link>
              ) : null}
            </>
          }
        />
      </>
    );
  }

  return <Shell>{body}</Shell>;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pt-7 pb-36 sm:px-8 md:pt-10 md:pb-16">
      {children}
      <p role="status" className="mt-6 font-heading text-meta text-text-muted">
        Preview: goals, milestones and XP here are examples, not saved account data yet.
      </p>
    </main>
  );
}

function TaskList({ goal, onComplete }: { goal: GoalDetail; onComplete: (taskId: string) => void }) {
  const visible = goal.tasks.filter((task) => !task.isPrivate && (!goal.isShared || task.assignee === "You"));
  if (visible.length === 0) {
    return <p className="rounded-[22px] bg-surface p-4 font-heading text-body text-text-muted shadow-raised">No linked tasks yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {visible.map((task) => (
        <li key={task.id} className="flex items-center gap-4 rounded-[22px] bg-surface px-4 py-3.5 shadow-raised">
          <TaskCheck id={`goal-${task.id}`} label={task.isDone ? `${task.title}, done` : `Complete ${task.title}`} checked={task.isDone} onChange={() => (task.isDone ? undefined : onComplete(task.id))} />
          <span>
            <span className={cn("block font-heading text-body font-bold", task.isDone ? "text-text-muted" : "text-text")}>{task.title}</span>
            <span className="block font-heading text-meta text-text-muted">{task.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function AddGoalTask({ goal, onSave, onCancel }: { goal: GoalDetail; onSave: (input: { title: string; when: TaskWhen; priority: TaskPriority }) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState<TaskWhen>("today");
  const [priority, setPriority] = useState<TaskPriority>("high");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (title.trim().length < 2) {
      setError("Give it a short name first.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), when, priority });
    } finally {
      setSaving(false);
    }
  }

  const choice = <T extends string>(legend: string, value: T, options: [T, string][], onChange: (value: T) => void) => (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2 font-heading text-label font-bold text-text">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map(([option, label]) => (
          <button key={option} type="button" role="radio" aria-checked={option === value} onClick={() => onChange(option)}>
            <Pill selected={option === value}>{label}</Pill>
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <>
      <SubHeader backHref={`/goals/${goal.id}`} backLabel="Back to goal" kicker="Goal · Add a task" title="One clear step toward your goal." subtitle={goal.title} />
      <form
        className="mt-5 grid gap-5 lg:grid-cols-2 lg:gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="flex flex-col gap-5">
          <label className="block">
            <span className="mb-2 block font-heading text-label font-bold text-text">Task</span>
            <input
              value={title}
              maxLength={120}
              onChange={(event) => {
                setTitle(event.target.value);
                setError(null);
              }}
              placeholder="Finish React exercises"
              className="w-full rounded-[22px] bg-surface px-5 py-4 font-heading text-body text-text shadow-inset outline outline-2 outline-accent placeholder:text-text-muted"
            />
          </label>
          {error ? (
            <p role="alert" className="-mt-3 font-heading text-meta text-warning">
              {error}
            </p>
          ) : null}
          {choice("When", when, [["today", "Today"], ["tomorrow", "Tomorrow"], ["pickDate", "Pick a date"]], setWhen)}
          {choice("Priority", priority, [["high", "High"], ["medium", "Medium"], ["low", "Low"]], setPriority)}
        </div>
        <div className="flex flex-col gap-4">
          <p className="rounded-[20px] bg-accent-tint p-4 font-heading text-label text-text">Linked automatically to this goal. It shows in Planner too.</p>
          <button type="submit" disabled={saving} className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 font-heading text-body font-bold text-white shadow-pressable disabled:opacity-60">
            Save task
          </button>
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        </div>
      </form>
    </>
  );
}
