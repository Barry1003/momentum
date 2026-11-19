"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CheckOrb, Skeleton } from "../components";
import { AriTile, Split } from "../habits/views";
import { CalendarIcon, ChevronRightIcon, MoveIcon, SparkleIcon } from "../home/icons";
import { cn } from "../lib/cn";
import type { AuditArea, GrowthStudioState } from "../mocks/types";
import { Badge, Panel, SubHeader } from "../planner/parts";

export { useOnline } from "../lib/useOnline";

function AriSays({ face, children }: { face: StaticImageData; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-cream ring-[3px] ring-white">
        <Image src={face} alt="Ari" width={44} height={44} className="h-full w-full object-cover" />
      </span>
      <p className="rounded-[18px] rounded-tl-md bg-surface px-4 py-3 font-heading text-label text-text shadow-raised">{children}</p>
    </div>
  );
}

function Note({ tone = "tint", title, children }: { tone?: "tint" | "warm"; title?: string; children: ReactNode }) {
  return (
    <section role={tone === "warm" ? "status" : undefined} className={cn("rounded-[22px] p-4", tone === "warm" ? "bg-[#fdeedd]" : "bg-accent-tint")}>
      {title ? <p className={cn("font-heading text-body font-bold", tone === "warm" ? "text-[#9a5b12]" : "text-accent-strong")}>{title}</p> : null}
      <p className={cn("font-heading text-label text-text", title ? "mt-1" : "")}>{children}</p>
    </section>
  );
}

const primary = "block w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable disabled:opacity-60";
const secondary = "block w-full rounded-full bg-surface py-4 text-center font-heading text-body font-bold text-accent-strong shadow-raised";

/** Figma 06d · Studio · Loading. Skeletons honour Reduce Motion; saved drafts are never blanked out. */
export function StudioLoading({ face }: { face: StaticImageData }) {
  return (
    <div aria-busy>
      <SubHeader backHref="/planner" backLabel="Back to plan" kicker="Growth Studio" title="Making a little room." subtitle="Getting your private workspace ready." />
      <Split
        left={
          <>
            <AriSays face={face}>One moment, I’m finding your notes.</AriSays>
            {[3, 2].map((rows, card) => (
              <section key={card} className="flex flex-col gap-4 rounded-[24px] bg-surface p-5 shadow-raised">
                {Array.from({ length: rows }, (_, row) => (
                  <div key={row} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-3 w-3/4 rounded-full" />
                      <Skeleton className="h-3 w-1/2 rounded-full" />
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </>
        }
        right={<Skeleton className="hidden h-40 rounded-[24px] lg:block" />}
      />
    </div>
  );
}

/** Figma 06d · Growth Studio · Empty: nothing started yet, three gentle ways in. */
export function StudioEmpty({ art }: { art: StaticImageData }) {
  const ways = [
    { href: "/growth?view=areas", icon: <SparkleIcon className="h-5 w-5" />, title: "Take the Life Audit", detail: "5 min · see where you are" },
    { href: "/growth?view=central", icon: <CalendarIcon className="h-5 w-5" />, title: "Choose a central goal", detail: "Use one you have or start fresh" },
    { href: "/planner?view=add", icon: <MoveIcon className="h-5 w-5" />, title: "Skip to a small action", detail: "Add one step to Planner" },
  ];
  return (
    <>
      <SubHeader backHref="/planner" backLabel="Back to plan" kicker="Growth Studio" title="A little space to begin." subtitle="Nothing accepted into your plan yet." />
      <Split
        left={<AriTile art={art} label="No rush" title="Start wherever feels easiest." body="The Studio is optional. My Space works fine without it." />}
        right={
          <>
            <Panel title="Three ways in">
              <ul className="divide-y divide-outline">
                {ways.map((way) => (
                  <li key={way.title}>
                    <Link href={way.href} className="flex items-center gap-3 py-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">{way.icon}</span>
                      <span className="flex-1">
                        <span className="block font-heading text-body font-bold text-text">{way.title}</span>
                        <span className="block font-heading text-meta text-text-muted">{way.detail}</span>
                      </span>
                      <ChevronRightIcon className="h-4 w-4 text-text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
            <Note>Suggestions don’t appear in Planner or Habits until you accept them.</Note>
          </>
        }
      />
    </>
  );
}

/** Figma 06d · Harada · Goal needed: the grid lost its goal, but its areas and actions stay. */
export function GoalNeeded({
  goals,
  busy,
  onUse,
}: {
  goals: { id: string; title: string; detail: string; isPaused: boolean }[];
  busy: boolean;
  onUse: (input: { goalId: string | null; newTitle?: string }) => void;
}) {
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const ready = Boolean(picked) || typed.trim().length >= 2;
  return (
    <>
      <SubHeader backHref="/growth" backLabel="Back to Growth Studio" kicker="Harada · Central goal" title="Give your goal a direction." subtitle="Your areas and actions are still here." />
      <Split
        left={
          <>
            <label className="block">
              <span className="mb-2 block font-heading text-body font-bold text-text">Central goal</span>
              <input
                value={typed}
                maxLength={80}
                aria-invalid={touched && !ready}
                onChange={(event) => {
                  setTyped(event.target.value);
                  setPicked(null);
                }}
                onBlur={() => setTouched(true)}
                placeholder="Choose a goal or type a title"
                className={cn("w-full rounded-[22px] bg-surface px-5 py-4 font-heading text-body text-text shadow-raised outline outline-2 placeholder:text-text-muted", touched && !ready ? "outline-[#c9822f]" : "outline-accent")}
              />
              <span className={cn("mt-1 block font-heading text-meta", touched && !ready ? "text-[#9a5b12]" : "text-text-muted")}>Your grid needs a central goal so actions link to it.</span>
            </label>
            <Panel title="Pick one you already have">
              <ul role="radiogroup" aria-label="Your goals" className="divide-y divide-outline">
                {goals.map((goal) => (
                  <li key={goal.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={picked === goal.id}
                      onClick={() => {
                        setPicked(goal.id);
                        setTyped("");
                      }}
                      className="flex w-full items-center gap-3 py-3 text-left"
                    >
                      <CheckOrb id={`need-${goal.id}`} size="sm" label={goal.title} checked={picked === goal.id} disabled onChange={() => undefined} />
                      <span>
                        <span className="block font-heading text-body font-bold text-text">{goal.title}</span>
                        <span className="block font-heading text-meta text-text-muted">{goal.isPaused ? "Paused" : goal.detail.split(" · ")[0]}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        }
        right={
          <>
            <button
              type="button"
              disabled={busy}
              className={primary}
              onClick={() => {
                setTouched(true);
                if (ready) onUse(picked ? { goalId: picked } : { goalId: null, newTitle: typed.trim() });
              }}
            >
              Use this goal
            </button>
            <Link href="/growth" className={secondary}>
              Save draft instead
            </Link>
          </>
        }
      />
    </>
  );
}

/** Figma 06d · Shared pattern · Couldn’t save. The draft stays exactly as it was typed. */
export function SaveProblem({ face, kept, busy, onRetry, onKeep }: { face: StaticImageData; kept: string | null; busy: boolean; onRetry: () => void; onKeep: () => void }) {
  return (
    <>
      <SubHeader backHref="/growth" backLabel="Back to Growth Studio" kicker="Shared state · Save error" title="Your words are still here." subtitle="Nothing you saved before has been replaced." />
      <Split
        left={
          <>
            <Note tone="warm" title="Couldn’t save just now">Your answers are kept in this draft. Nothing that was saved before has been replaced.</Note>
            {kept ? (
              <div>
                <p className="mb-2 font-heading text-body font-bold text-text">Kept in your draft</p>
                <p className="flex items-center justify-between gap-3 rounded-[22px] bg-surface px-5 py-3.5 font-heading text-body text-text shadow-raised">
                  <span className="min-w-0 truncate">{kept}</span>
                  <span className="shrink-0 font-heading text-meta font-bold text-accent-strong">Not saved</span>
                </p>
              </div>
            ) : null}
            <AriSays face={face}>No need to rewrite anything. Try again when you’re ready.</AriSays>
          </>
        }
        right={
          <>
            <button type="button" disabled={busy} onClick={onRetry} className={primary}>
              Try again
            </button>
            <button type="button" onClick={onKeep} className={secondary}>
              Keep as draft
            </button>
            <Note>Nothing is sent to your squad. Nothing in your plan has changed.</Note>
          </>
        }
      />
    </>
  );
}

/** Figma 06d · Shared pattern · Offline. Editing continues; nothing is accepted, scheduled or shared. */
export function OfflineStudio({ state, onKeepEditing, onRetry }: { state: GrowthStudioState; onKeepEditing: () => void; onRetry: () => void }) {
  const rated = state.areas.filter((area: AuditArea) => area.rating !== null).slice(0, 2);
  const drafts = (state.grid?.actions ?? []).filter((action) => action.status !== "accepted").slice(0, 2);
  return (
    <>
      <SubHeader backHref="/growth" backLabel="Back to Growth Studio" kicker="Shared state · Offline" title="Offline, not starting over." subtitle="Your saved work is unchanged." />
      <Split
        left={
          <>
            <Note tone="warm" title="You’re offline">Keep editing this draft. We’ll ask before saving once you reconnect, so nothing newer gets overwritten.</Note>
            <Panel title="Safe on this device">
              <ul className="divide-y divide-outline">
                {rated.map((area) => (
                  <li key={area.id} className="flex items-center gap-3 py-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">
                      <MoveIcon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-heading text-body font-bold text-text">{area.name}</span>
                      <span className="block font-heading text-meta text-text-muted">
                        {area.rating} / 5{area.note ? " · note kept" : ""}
                      </span>
                    </span>
                    <Badge>Draft</Badge>
                  </li>
                ))}
                {drafts.map((action) => (
                  <li key={action.id} className="flex items-center gap-3 py-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">
                      <CalendarIcon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-heading text-body font-bold text-text">{action.title}</span>
                      <span className="block font-heading text-meta text-text-muted">Draft change</span>
                    </span>
                    <Badge>Draft</Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        }
        right={
          <>
            <button type="button" onClick={onKeepEditing} className={primary}>
              Keep editing
            </button>
            <button type="button" onClick={onRetry} className={secondary}>
              Retry connection
            </button>
            <Note>Nothing has been accepted, scheduled or shared while offline.</Note>
          </>
        }
      />
    </>
  );
}
