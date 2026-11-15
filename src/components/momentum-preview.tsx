"use client";

import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { ProgressMeter } from "@/components/ui/progress-meter";

type View = "home" | "planner" | "habits" | "squad";
type Task = { id: number; title: string; completed: boolean; when: string };
type Habit = { id: number; title: string; completed: boolean };

const navigation: { id: View; label: string; symbol: string }[] = [
  { id: "home", label: "Home", symbol: "⌂" },
  { id: "planner", label: "Planner", symbol: "▦" },
  { id: "habits", label: "Habits", symbol: "◈" },
  { id: "squad", label: "Squad", symbol: "◎" },
];

const initialTasks: Task[] = [
  { id: 1, title: "Finish the chapter outline", completed: false, when: "Today" },
  { id: 2, title: "Review the weekly plan", completed: true, when: "Today" },
  { id: 3, title: "Practice for 30 minutes", completed: false, when: "Tomorrow" },
];

const initialHabits: Habit[] = [
  { id: 1, title: "Read for 20 minutes", completed: true },
  { id: 2, title: "Move your body", completed: false },
  { id: 3, title: "Reflect on the day", completed: false },
];

function TaskList({ tasks, onToggle }: { tasks: Task[]; onToggle: (id: number) => void }) {
  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-3 py-4">
          <input
            aria-label={`Complete ${task.title}`}
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            className="size-5 shrink-0 accent-violet-700"
          />
          <span className={`min-w-0 flex-1 text-sm font-medium ${task.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>{task.title}</span>
          <span className="text-xs text-slate-400">{task.when}</span>
        </li>
      ))}
    </ul>
  );
}

export function MomentumPreview() {
  const [view, setView] = useState<View>("home");
  const [tasks, setTasks] = useState(initialTasks);
  const [habits, setHabits] = useState(initialHabits);
  const [draft, setDraft] = useState("");
  const taskInputId = useId();
  const completedTasks = tasks.filter((task) => task.completed).length;
  const completedHabits = habits.filter((habit) => habit.completed).length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
  const welcome = useMemo(() => new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date()), []);

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (!title || title.length > 120) return;
    setTasks((previous) => [...previous, { id: Date.now(), title, completed: false, when: "Today" }]);
    setDraft("");
  }

  const toggleTask = (id: number) => setTasks((previous) => previous.map((task) => task.id === id ? { ...task, completed: !task.completed } : task));

  return (
    <div className="min-h-dvh bg-[#f8f9fc] text-slate-900">
      <a href="#main-content" className="sr-only rounded-lg bg-violet-700 p-3 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to content</a>
      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-7 md:flex lg:w-64" aria-label="Main navigation">
          <span className="px-3 text-xl font-black tracking-tight text-violet-800">◉ Momentum</span>
          <p className="mt-2 px-3 text-xs text-slate-500">A little progress, every day.</p>
          <nav className="mt-12 space-y-1" aria-label="Desktop">
            {navigation.map((item) => <button key={item.id} type="button" aria-current={view === item.id ? "page" : undefined} onClick={() => setView(item.id)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors ${view === item.id ? "bg-violet-50 text-violet-800" : "text-slate-600 hover:bg-slate-50"}`}><span aria-hidden className="w-5 text-center text-xl">{item.symbol}</span>{item.label}</button>)}
          </nav>
          <div className="mt-auto rounded-2xl bg-violet-50 p-4">
            <p className="text-sm font-semibold text-violet-900">Your space to grow</p>
            <p className="mt-1 text-xs leading-5 text-violet-700">Build good habits alongside people who care.</p>
          </div>
        </aside>
        <div className="min-w-0 flex-1 pb-24 md:pb-10">
          <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8 lg:px-12">
            <span className="text-lg font-black tracking-tight text-violet-800 md:hidden">◉ Momentum</span>
            <div className="hidden md:block"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Your workspace</p><p className="text-sm font-semibold">Keep your momentum going</p></div>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800" title="This preview uses sample data; changes do not persist">Preview · sample data</span>
          </header>
          <main id="main-content" className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
            {view === "home" && <>
              <div className="space-y-2"><p className="text-sm font-semibold text-violet-700">{welcome} · Your overview</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Small steps. Real progress.</h1><p className="max-w-2xl text-sm leading-6 text-slate-500">See what matters today, and celebrate every step with your squad.</p></div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Panel as="article"><p className="text-sm text-slate-500">Tasks completed</p><p className="mt-3 text-3xl font-bold">{completedTasks}<span className="text-lg font-normal text-slate-400"> / {tasks.length}</span></p><div className="mt-4"><ProgressMeter value={progress} label="Completed task progress" /></div></Panel>
                <Panel as="article"><p className="text-sm text-slate-500">Habits today</p><p className="mt-3 text-3xl font-bold">{completedHabits}<span className="text-lg font-normal text-slate-400"> / {habits.length}</span></p><p className="mt-4 text-xs text-slate-500">Every effort counts.</p></Panel>
                <Panel as="article"><p className="text-sm text-slate-500">Squad</p><p className="mt-3 text-3xl font-bold">Together</p><p className="mt-4 text-xs text-slate-500">Your friends' updates will appear here once connected.</p></Panel>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                <Panel><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Your next steps</h2><Button variant="ghost" onClick={() => setView("planner")}>Open planner <span aria-hidden>→</span></Button></div><TaskList tasks={tasks.filter((task) => !task.completed).slice(0, 3)} onToggle={toggleTask} />{tasks.every((task) => task.completed) && <p className="py-5 text-sm text-slate-500">All caught up. Nice work!</p>}</Panel>
                <Panel><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Daily habits</h2><Button variant="ghost" onClick={() => setView("habits")}>View habits <span aria-hidden>→</span></Button></div><p className="mt-3 text-sm text-slate-500">Make room for the routines that help you grow.</p><div className="mt-6"><ProgressMeter value={habits.length ? completedHabits * 100 / habits.length : 0} label="Daily habit progress" /></div><p className="mt-2 text-sm font-semibold text-violet-700">{completedHabits} of {habits.length} complete</p></Panel>
              </div>
            </>}
            {view === "planner" && <>
              <div><p className="text-sm font-semibold text-violet-700">Plan your day</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Planner</h1><p className="mt-2 text-sm text-slate-500">Capture the important things and take them one step at a time.</p></div>
              <Panel><h2 className="text-lg font-bold">Add a task</h2><form onSubmit={addTask} className="mt-4 flex flex-col gap-3 sm:flex-row"><label htmlFor={taskInputId} className="sr-only">Task title</label><input id={taskInputId} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={120} placeholder="What would you like to do?" className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none placeholder:text-slate-400 focus-visible:border-violet-600 focus-visible:ring-2 focus-visible:ring-violet-200" /><Button type="submit" disabled={!draft.trim()}>Add task</Button></form></Panel>
              <Panel><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Your tasks</h2><span className="text-sm text-slate-500">{completedTasks} / {tasks.length} done</span></div><TaskList tasks={tasks} onToggle={toggleTask} /></Panel>
            </>}
            {view === "habits" && <>
              <div><p className="text-sm font-semibold text-violet-700">Show up for yourself</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Habit tracker</h1><p className="mt-2 text-sm text-slate-500">Consistency grows one check-in at a time.</p></div>
              <Panel><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-bold">Today's habits</h2><span className="text-sm font-semibold text-violet-700">{completedHabits} of {habits.length}</span></div><div className="mt-5"><ProgressMeter value={habits.length ? completedHabits / habits.length * 100 : 0} label="Habits completed today" /></div><ul className="mt-6 space-y-3">{habits.map((habit) => <li key={habit.id}><label className="flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4"><input type="checkbox" checked={habit.completed} onChange={() => setHabits((previous) => previous.map((item) => item.id === habit.id ? { ...item, completed: !item.completed } : item))} className="size-5 accent-violet-700" /><span className={`text-sm font-semibold ${habit.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>{habit.title}</span></label></li>)}</ul></Panel>
            </>}
            {view === "squad" && <>
              <div><p className="text-sm font-semibold text-violet-700">Better together</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your squad</h1><p className="mt-2 text-sm text-slate-500">A shared space for encouragement and accountability.</p></div>
              <Panel className="max-w-2xl"><div aria-hidden className="flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-3xl text-violet-700">◎</div><h2 className="mt-5 text-xl font-bold">Your people, your progress</h2><p className="mt-2 max-w-lg text-sm leading-7 text-slate-500">Invitations, member updates, and shared goals will be available here when the squad backend is ready. This preview never exposes real member information.</p><span className="mt-6 inline-block rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Backend integration pending</span></Panel>
            </>}
          </main>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden" aria-label="Mobile">
        {navigation.map((item) => <button key={item.id} type="button" aria-current={view === item.id ? "page" : undefined} onClick={() => setView(item.id)} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold ${view === item.id ? "bg-violet-50 text-violet-800" : "text-slate-500"}`}><span aria-hidden className="text-xl">{item.symbol}</span>{item.label}</button>)}
      </nav>
    </div>
  );
}
