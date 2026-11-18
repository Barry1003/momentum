"use client";

import { usePathname } from "next/navigation";
import { BottomNav, Card, Logo, Sidebar, Tag } from "@/frontend/components";
import { Companion } from "@/frontend/companion";
import { useToday } from "@/frontend/hooks/useToday";
import { useSquad } from "@/frontend/hooks/useSquad";
import { useHabits } from "@/frontend/hooks/useHabits";

const hrefs = { home: "/home", plan: "/planner", progress: "/progress", me: "/my-space" } as const;
const desktopHrefs = { ...hrefs, create: "/planner" } as const;

export function WorkspacePreview() {
  const pathname = usePathname();
  const view = pathname === "/home" ? "home" : pathname === "/planner" ? "plan" : pathname === "/progress" ? "progress" : "me";
  const today = useToday();
  const squad = useSquad();
  const habits = useHabits();

  return (
    <div className="min-h-dvh md:flex">
      <Sidebar activeKey={view === "me" ? "me" : view} hrefs={desktopHrefs} />
      <main className="mx-auto w-full max-w-[920px] px-4 pb-32 pt-7 sm:px-8 md:pb-16 md:pt-12">
        <div className="mb-7 flex items-center justify-between md:hidden">
          <Logo />
          <Tag>Preview</Tag>
        </div>
        <header className="mb-7">
          <p className="font-heading text-meta font-bold uppercase tracking-widest text-accent-strong">Momentum · Interactive preview</p>
          <h1 className="mt-2 font-display text-display font-extrabold text-text">
            {view === "home" ? "Squad Room" : view === "plan" ? "Your plan" : view === "progress" ? "Your progress" : "My Space"}
          </h1>
          <p className="mt-2 max-w-2xl font-heading text-body text-text-muted">
            {view === "home" ? "Show up together, at your own pace." : view === "plan" ? "One clear step at a time." : view === "progress" ? "Celebrate the steps you've taken." : "A calm place for your goals and your growth."}
          </p>
        </header>

        <div className="mb-5 rounded-card bg-accent-tint p-4 text-sm text-accent-strong">
          This workspace uses sample data. Authentication, real saving and squad permissions will be connected in a separate backend integration.
        </div>

        {view === "me" ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="flex flex-col items-center gap-4 bg-cream text-center">
              <Companion stage="child" reaction="idle" look={{ room: "lavender", outfit: "original" }} size="hero" />
              <h2 className="font-display text-heading font-extrabold">Your companion is growing with you</h2>
              <p className="font-heading text-body text-text-muted">Show up today. Small steps count.</p>
            </Card>
            <Card>
              <h2 className="font-display text-heading font-extrabold">Today's focus</h2>
              <div className="mt-4 space-y-3">
                {today.isLoading ? <p>Loading sample tasks…</p> : (today.data?.tasks ?? []).slice(0, 4).map((task) => (
                  <label key={task.id} className="flex items-center gap-3 border-b border-outline py-2">
                    <input type="checkbox" checked={task.isDone} disabled={task.isDone} onChange={() => void today.completeTask(task.id)} className="size-5 accent-violet-700" />
                    <span className={task.isDone ? "text-text-muted line-through" : "text-text"}>{task.title}</span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        ) : view === "home" ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="bg-cream">
              <h2 className="font-display text-heading font-extrabold">We're growing together</h2>
              <div className="mt-5 flex justify-center">
                <Companion stage="teen" reaction="idle" look={{ room: "lavender", outfit: "original" }} size="hero" />
              </div>
            </Card>
            <Card>
              <h2 className="mb-4 font-display text-heading font-extrabold">Your people</h2>
              {squad.isLoading ? <p>Loading squad preview…</p> : (squad.data?.members ?? []).map((member) => (
                <p key={member.id} className="border-b border-outline py-2 text-sm">{member.name} · {member.isCheckedInToday ? "Checked in" : "Taking their time"}</p>
              ))}
            </Card>
          </div>
        ) : view === "plan" ? (
          <Card>
            <h2 className="mb-4 font-display text-heading font-extrabold">Today</h2>
            {today.isLoading ? <p>Loading plan…</p> : (today.data?.tasks ?? []).map((task) => (
              <label key={task.id} className="flex items-center gap-3 border-b border-outline py-3">
                <input type="checkbox" checked={task.isDone} disabled={task.isDone} onChange={() => void today.completeTask(task.id)} className="size-5 accent-violet-700" />
                <span className={task.isDone ? "text-text-muted line-through" : "text-text"}>{task.title}</span>
              </label>
            ))}
          </Card>
        ) : (
          <Card>
            <h2 className="mb-4 font-display text-heading font-extrabold">Habits, one day at a time</h2>
            {habits.isLoading ? <p>Loading habits…</p> : (habits.data?.habits ?? []).map((habit) => (
              <div key={habit.id} className="flex items-center justify-between gap-3 border-b border-outline py-3">
                <div>
                  <p className="font-heading font-bold">{habit.name}</p>
                  <p className="text-sm text-text-muted">{habit.completedCount} / {habit.targetCount} today</p>
                </div>
                <button className="rounded-button bg-accent-tint px-4 py-2 text-sm font-bold text-accent-strong disabled:opacity-50" type="button" disabled={habit.completedCount >= habit.targetCount} onClick={() => void habits.incrementHabit(habit.id)}>+1</button>
              </div>
            ))}
          </Card>
        )}
      </main>
      <BottomNav activeKey={view === "me" ? "me" : view} hrefs={hrefs} onCreate={() => { window.location.href = "/planner"; }} />
    </div>
  );
}
