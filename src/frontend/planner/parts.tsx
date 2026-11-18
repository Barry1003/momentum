"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { BackIcon, BellIcon, CheckIcon, PlusIcon } from "../home/icons";

export type PlannerView = "today" | "week" | "tasks" | "goals" | "shared" | "add";

export const PLANNER_TABS: { view: PlannerView; label: string }[] = [
  { view: "today", label: "Today" },
  { view: "week", label: "Week" },
  { view: "tasks", label: "Tasks" },
  { view: "goals", label: "Goals" },
];

export function plannerHref(view: PlannerView): string {
  return view === "today" ? "/planner" : `/planner?view=${view}`;
}

/** Today's wide segmented control. */
export function SegmentedTabs({ active }: { active: PlannerView }) {
  return (
    <nav aria-label="Plan views" className="flex rounded-full bg-accent-tint/70 p-1 shadow-inset">
      {PLANNER_TABS.map((tab) => (
        <Link
          key={tab.view}
          href={plannerHref(tab.view)}
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

/** Pill tabs used on the Week, Tasks and Goals screens. */
export function PillTabs({ active }: { active: PlannerView }) {
  return (
    <nav aria-label="Plan views" className="flex flex-wrap gap-2">
      {PLANNER_TABS.map((tab) => (
        <Link key={tab.view} href={plannerHref(tab.view)} scroll={false} aria-current={tab.view === active ? "page" : undefined}>
          <Pill selected={tab.view === active}>{tab.label}</Pill>
        </Link>
      ))}
    </nav>
  );
}

export function Pill({ selected, children }: { selected: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-4 py-2.5 font-heading text-label font-bold transition",
        selected ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : "bg-surface text-accent-strong shadow-raised",
      )}
    >
      {children}
    </span>
  );
}

export function PillButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick}>
      <Pill selected={selected}>{children}</Pill>
    </button>
  );
}

export function BellButton() {
  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface text-text shadow-raised"
    >
      <BellIcon className="h-5 w-5" />
    </Link>
  );
}

/** Header for the sub-screens: back to Today, kicker, title and a quiet subtitle. */
export function SubHeader({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <Link
          href="/planner"
          aria-label="Back to today"
          className="mt-3 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-accent-strong shadow-raised md:hidden"
        >
          <BackIcon className="h-4 w-4" />
        </Link>
        <div>
          <p className="font-heading text-meta font-bold tracking-widest text-text-muted uppercase">{kicker}</p>
          <h1 className="mt-1 font-display text-display font-extrabold text-text">{title}</h1>
          {subtitle ? <p className="mt-2 font-heading text-body text-text-muted">{subtitle}</p> : null}
        </div>
      </div>
      <span className="hidden md:block">
        <BellButton />
      </span>
    </header>
  );
}

export function PlusButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Add a task"
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface text-text shadow-raised"
    >
      <PlusIcon className="h-5 w-5" />
    </Link>
  );
}

/** Rounded-square checkbox used on Today. */
export function TaskCheck({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label htmlFor={id} className="relative inline-grid h-7 w-7 shrink-0 cursor-pointer place-items-center">
      <input id={id} type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" aria-label={label} />
      <span
        aria-hidden
        className={cn(
          "grid h-7 w-7 place-items-center rounded-[9px] transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent",
          checked ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : "bg-accent-tint shadow-inset",
        )}
      >
        {checked ? <CheckIcon className="h-4 w-4" /> : null}
      </span>
    </label>
  );
}

export function Badge({ tone = "accent", children }: { tone?: "accent" | "warm"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-3 py-1 font-heading text-meta font-bold",
        tone === "warm" ? "bg-[#fbeedd] text-[#9a5b12]" : "bg-accent-tint text-accent-strong",
      )}
    >
      {children}
    </span>
  );
}

export function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[26px] bg-surface p-4 shadow-raised", className)}>
      {title ? <h2 className="mb-1 font-heading text-meta tracking-wide text-text-muted uppercase">{title}</h2> : null}
      {children}
    </section>
  );
}
