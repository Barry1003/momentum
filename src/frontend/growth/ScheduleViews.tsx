"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { STAGE_ART } from "../companion";
import { Skeleton } from "../components";
import { AriTile, Split } from "../habits/views";
import { monthCells, weekDates } from "../habits/format";
import { useShell } from "../home/AppShell";
import { CalendarIcon, PlayIcon, ReadIcon, SparkleIcon } from "../home/icons";
import { useToday } from "../hooks";
import { cn } from "../lib/cn";
import { checkSlot, getBusy, getBusyDays, getScheduler, scheduleTask, setQuadrant } from "../mocks/repository";
import type { BusyBlock, Quadrant, SchedulerItem, SlotCheck } from "../mocks/types";
import { Badge, Panel, Pill, SubHeader } from "../planner/parts";

export type ScheduleView = "scheduler" | "schedTask" | "unscheduled" | "schedDay" | "schedTime" | "schedReview" | "schedSaved";
export const SCHEDULE_VIEWS: ScheduleView[] = ["scheduler", "schedTask", "unscheduled", "schedDay", "schedTime", "schedReview", "schedSaved"];

const QUADRANTS: { value: Quadrant; kicker: string; title: string; empty: string; tone: string }[] = [
  { value: "doNext", kicker: "Important · urgent", title: "Do next", empty: "Nothing pressing. Nice.", tone: "bg-accent-tint" },
  { value: "planTime", kicker: "Important · not urgent", title: "Plan a time", empty: "Nothing waiting for a time.", tone: "bg-surface" },
  { value: "reconsider", kicker: "Urgent · not important", title: "Reconsider", empty: "Nothing here. You decide what can move.", tone: "bg-[#f8efdf]" },
  { value: "leaveRoom", kicker: "Neither", title: "Leave room", empty: "Empty space is allowed.", tone: "bg-[#f8efdf]" },
];

const go = (view: ScheduleView, extra = "") => `/growth?view=${view}${extra ? `&${extra}` : ""}`;

function localIso(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function subscribeMinute(callback: () => void) {
  const id = window.setInterval(callback, 60_000);
  return () => window.clearInterval(id);
}
function useTodayIso(): string {
  return useSyncExternalStore(subscribeMinute, localIso, localIso);
}

function endTime(time: string, minutes: number): string {
  const total = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function dayLong(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return `${date.toLocaleDateString("en-GB", { weekday: "long" })} ${date.getDate()} ${date.toLocaleDateString("en-GB", { month: "long" })}`;
}
function dayShort(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return `${date.toLocaleDateString("en-GB", { weekday: "short" })} ${date.getDate()}`;
}

function Primary({ children, onClick, disabled, to }: { children: ReactNode; onClick?: () => void; disabled?: boolean; to?: string }) {
  const className = "block w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable disabled:opacity-60";
  return to ? (
    <Link href={to} className={className}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}
function Secondary({ children, onClick, to }: { children: ReactNode; onClick?: () => void; to?: string }) {
  const className = "block w-full rounded-full bg-surface py-4 text-center font-heading text-body font-bold text-accent-strong shadow-raised";
  return to ? (
    <Link href={to} className={className}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
function Note({ tone = "tint", title, children }: { tone?: "tint" | "warm" | "success"; title?: string; children: ReactNode }) {
  const bg = { tint: "bg-accent-tint", warm: "bg-[#fdeedd]", success: "bg-success-tint" }[tone];
  const fg = { tint: "text-accent-strong", warm: "text-[#9a5b12]", success: "text-success" }[tone];
  return (
    <section className={cn("rounded-[22px] p-4", bg)} role={tone === "warm" ? "status" : undefined}>
      {title ? <p className={cn("font-heading text-body font-bold", fg)}>{title}</p> : null}
      <p className={cn("font-heading text-label text-text", title ? "mt-1" : "")}>{children}</p>
    </section>
  );
}
function AriSays({ face, children }: { face: Parameters<typeof Image>[0]["src"]; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-cream ring-[3px] ring-white">
        <Image src={face} alt="Ari" width={44} height={44} className="h-full w-full object-cover" />
      </span>
      <p className="rounded-[18px] rounded-tl-md bg-surface px-4 py-3 font-heading text-label text-text shadow-raised">{children}</p>
    </div>
  );
}

function WeekStrip({ week, selected, onSelect }: { week: string[]; selected: string; onSelect: (iso: string) => void }) {
  const first = new Date(`${week[0]}T12:00:00`);
  return (
    <section className="rounded-[24px] bg-surface p-4 shadow-raised">
      <p className="font-heading text-meta tracking-wide text-text-muted uppercase">{first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
      <div className="mt-3 flex justify-between">
        {week.map((iso) => {
          const date = new Date(`${iso}T12:00:00`);
          const isSelected = iso === selected;
          return (
            <button
              key={iso}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(iso)}
              className={cn("flex w-11 flex-col items-center rounded-[16px] py-2 font-heading", isSelected ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : "text-text")}
            >
              <span className={cn("text-meta", isSelected ? "text-white/85" : "text-text-muted")}>{date.toLocaleDateString("en-GB", { weekday: "short" })}</span>
              <span className="text-heading font-bold">{date.getDate()}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Figma 06b · Growth Studio · Make room: quadrants, unscheduled, choose a day and time, conflicts, review, saved. */
export function ScheduleViews({ view }: { view: ScheduleView }) {
  const params = useSearchParams();
  const router = useRouter();
  const { showToast } = useShell();
  const today = useToday();
  const todayIso = useTodayIso();
  const art = STAGE_ART[today.data?.companion.stage ?? "teen"];
  const [data, setData] = useState<{ items: SchedulerItem[]; drafts: { id: string; title: string; area: string }[] } | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    void getScheduler().then((result) => {
      if (alive) setData(result);
    });
    return () => {
      alive = false;
    };
  }, [version]);

  if (!data) {
    return <Skeleton className="h-96 rounded-[28px]" />;
  }

  const taskId = params.get("task") ?? "";
  const item = data.items.find((entry) => entry.taskId === taskId) ?? null;
  const unscheduled = data.items.filter((entry) => !entry.time);

  if (view === "scheduler") {
    const next = unscheduled.find((entry) => (entry.quadrant === "planTime" || entry.quadrant === "doNext") && entry.taskId);
    return (
      <>
        <SubHeader backHref="/growth" backLabel="Back to Growth Studio" kicker="Quadrant scheduler" title="Make room for what matters." subtitle="Important and urgent are choices, not judgments." />
        <Split
          left={
            <div className="grid grid-cols-2 gap-3">
              {QUADRANTS.map((quadrant) => {
                const inBox = data.items.filter((entry) => entry.quadrant === quadrant.value);
                return (
                  <section key={quadrant.value} className={cn("flex min-h-[160px] flex-col gap-2 rounded-[22px] p-3 shadow-raised", quadrant.tone)}>
                    <p className="font-heading text-meta tracking-wide text-accent-strong uppercase">{quadrant.kicker}</p>
                    <p className="font-heading text-body font-bold text-text">{quadrant.title}</p>
                    {inBox.length === 0 ? (
                      <p className="font-heading text-meta text-text-muted">{quadrant.empty}</p>
                    ) : (
                      inBox.map((entry) => (
                        <Link key={entry.taskId} href={go("schedTask", `task=${entry.taskId}`)} className="rounded-[16px] bg-surface p-3 shadow-raised">
                          <span className="block font-heading text-label font-bold text-text">{entry.title}</span>
                          <span className="block font-heading text-meta text-text-muted">{entry.time ? `${entry.time} · ${entry.minutes} min` : entry.detail}</span>
                        </Link>
                      ))
                    )}
                  </section>
                );
              })}
            </div>
          }
          right={
            <>
              {next ? <AriSays face={art.face}>{`${next.title} doesn’t have a time yet. Want to find one?`}</AriSays> : <AriSays face={art.face}>Everything important has a place. Nicely done.</AriSays>}
              {next ? <Primary to={go("schedDay", `task=${next.taskId}`)}>{`Find a time for ${next.title.split(" ").slice(0, 3).join(" ").toLowerCase()}`}</Primary> : null}
              <Secondary to={go("unscheduled")}>See unscheduled actions</Secondary>
              <Note>Moving a task between boxes only changes its label. Nothing gets rescheduled by itself.</Note>
            </>
          }
        />
      </>
    );
  }

  if (view === "unscheduled") {
    return (
      <>
        <SubHeader backHref={go("scheduler")} backLabel="Back to quadrants" kicker="Scheduler · Unscheduled" title="A little room in your plan." subtitle="Accepted actions without a time yet." />
        <Split
          left={
            <Panel title="Accepted">
              {unscheduled.length === 0 ? (
                <p className="py-3 font-heading text-body text-text-muted">Everything accepted has a time.</p>
              ) : (
                <ul className="divide-y divide-outline">
                  {unscheduled.map((entry) => (
                    <li key={entry.taskId}>
                      <Link href={go("schedDay", `task=${entry.taskId}`)} className="flex items-center gap-3 py-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">
                          <CalendarIcon className="h-5 w-5" />
                        </span>
                        <span className="flex-1">
                          <span className="block font-heading text-body font-bold text-text">{entry.title}</span>
                          <span className="block font-heading text-meta text-text-muted">{[`${entry.minutes} min`, entry.goalName].filter(Boolean).join(" · ")}</span>
                        </span>
                        <Badge>Pick a time</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          }
          right={
            <>
              {data.drafts.length ? (
                <Panel title="Still drafts · not in your plan">
                  <ul className="divide-y divide-outline">
                    {data.drafts.map((draft) => (
                      <li key={draft.id}>
                        <Link href={`/growth?view=action&action=${draft.id}`} className="flex items-center gap-3 py-3">
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">
                            <SparkleIcon className="h-5 w-5" />
                          </span>
                          <span className="flex-1">
                            <span className="block font-heading text-body font-bold text-text">{draft.title}</span>
                            <span className="block font-heading text-meta text-text-muted">{draft.area} · not accepted yet</span>
                          </span>
                          <Badge tone="warm">Review</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}
              <Note title="No need to fill every space">An accepted task can stay unscheduled. It will still show in Today without a time.</Note>
            </>
          }
        />
      </>
    );
  }

  if (!item) {
    return (
      <>
        <SubHeader backHref={go("scheduler")} backLabel="Back to quadrants" kicker="Scheduler" title="That task isn’t here any more." subtitle="It may be done or removed." />
        <div className="mt-5 max-w-md">
          <Primary to={go("scheduler")}>Back to quadrants</Primary>
        </div>
      </>
    );
  }

  if (view === "schedTask") {
    return (
      <TaskBox
        key={item.taskId}
        item={item}
        art={art.full}
        onMove={(quadrant) =>
          void setQuadrant(item.taskId, quadrant).then(() => {
            setVersion((value) => value + 1);
            showToast("Moved. Only the label changed.");
          })
        }
      />
    );
  }

  if (view === "schedDay") return <ChooseDay key={item.taskId} item={item} todayIso={todayIso} />;

  if (view === "schedTime") {
    return <ChooseTime key={`${item.taskId}-${params.get("date")}`} item={item} todayIso={todayIso} face={art.face} />;
  }

  if (view === "schedReview") {
    const date = params.get("date") ?? todayIso;
    const time = params.get("time") ?? "";
    const repeats = params.get("repeat") === "daily";
    return (
      <ReviewSchedule
        key={`${date}-${time}`}
        item={item}
        date={date}
        time={time}
        repeats={repeats}
        onSave={async (repeatsDaily) => {
          await scheduleTask(item.taskId, { date, time, repeatsDaily });
          router.push(go("schedSaved", `task=${item.taskId}&date=${date}&time=${time}&repeat=${repeatsDaily ? "daily" : "once"}`));
        }}
      />
    );
  }

  // schedSaved
  const date = params.get("date") ?? todayIso;
  const time = params.get("time") ?? item.time ?? "";
  const repeats = params.get("repeat") === "daily";
  return (
    <>
      <SubHeader backHref={go("scheduler")} backLabel="Back to quadrants" kicker="Schedule · Saved" title="Your next step has a place." subtitle={`${dayShort(date)} · ${time}–${endTime(time, item.minutes)}${repeats ? " · every day" : ""}`} />
      <Split
        left={
          <AriTile art={art.full} label="Added to Planner" title={item.title} body={`${repeats ? "Daily" : dayShort(date)} at ${time}${item.goalName ? ` · ${item.goalName}` : ""}`}>
            <span className="mt-3 flex gap-2">
              <span className="rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">Private</span>
              {item.goalName ? <span className="rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">Linked</span> : null}
            </span>
          </AriTile>
        }
        right={
          <>
            <Panel title="What changed">
              <ul className="divide-y divide-outline">
                <li className="py-3">
                  <span className="block font-heading text-body font-bold text-text">Planner</span>
                  <span className="block font-heading text-meta text-text-muted">{repeats ? `One daily task at ${time}. Not a copy.` : `One task on ${dayShort(date)} at ${time}. Not a copy.`}</span>
                </li>
                {item.goalName ? (
                  <li className="py-3">
                    <span className="block font-heading text-body font-bold text-text">Goal Details</span>
                    <span className="block font-heading text-meta text-text-muted">Shows the same linked task</span>
                  </li>
                ) : null}
              </ul>
            </Panel>
            <Primary to="/planner">Open Planner</Primary>
            <Secondary to={go("scheduler")}>Back to quadrants</Secondary>
          </>
        }
      />
    </>
  );
}

function TaskBox({ item, art, onMove }: { item: SchedulerItem; art: Parameters<typeof AriTile>[0]["art"]; onMove: (quadrant: Quadrant) => void }) {
  return (
    <>
      <SubHeader backHref={go("scheduler")} backLabel="Back to quadrants" kicker="Scheduler · Task" title="One clear step." subtitle={item.fromGrowthStudio ? "Private task · accepted from Growth Studio" : "Private task"} />
      <Split
        left={
          <AriTile art={art} label={item.title} title={`${item.minutes} min · ${item.repeatsDaily ? "Daily" : "Once"} · ${item.priority[0].toUpperCase()}${item.priority.slice(1)}`} body={item.goalName ? `Goal: ${item.goalName}` : "No goal linked"}>
            <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">{item.time ? `${item.time}${item.scheduledDate ? ` · ${dayShort(item.scheduledDate)}` : ""}` : "Not scheduled"}</span>
          </AriTile>
        }
        right={
          <>
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2 font-heading text-body font-bold text-text">Which box does it belong in?</legend>
              <div role="radiogroup" aria-label="Box" className="flex flex-wrap gap-2">
                {QUADRANTS.map((quadrant) => (
                  <button key={quadrant.value} type="button" role="radio" aria-checked={item.quadrant === quadrant.value} onClick={() => onMove(quadrant.value)}>
                    <Pill selected={item.quadrant === quadrant.value}>{quadrant.title}</Pill>
                  </button>
                ))}
              </div>
            </fieldset>
            <Note>This is the same task as in Planner. Editing it here updates it there.</Note>
            <Primary to={go("schedDay", `task=${item.taskId}`)}>{item.time ? "Change day & time" : "Pick a day & time"}</Primary>
            <Secondary to="/planner">Open in Planner</Secondary>
          </>
        }
      />
    </>
  );
}

function ChooseDay({ item, todayIso }: { item: SchedulerItem; todayIso: string }) {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(item.scheduledDate && item.scheduledDate >= todayIso ? item.scheduledDate : todayIso);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);
  const [busyDays, setBusyDays] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<BusyBlock[] | null>(null);
  const base = new Date(`${todayIso}T12:00:00`);
  const shown = new Date(base.getFullYear(), base.getMonth() + offset, 1, 12);
  const shownYear = shown.getFullYear();
  const shownMonth = shown.getMonth();

  useEffect(() => {
    let alive = true;
    void getBusyDays(shownYear, shownMonth).then((days) => {
      if (alive) setBusyDays(days);
    });
    return () => {
      alive = false;
    };
  }, [shownYear, shownMonth]);

  useEffect(() => {
    let alive = true;
    void getBusy(selected, item.taskId).then((result) => {
      if (alive) setBlocks(result);
    });
    return () => {
      alive = false;
    };
  }, [selected, item.taskId]);

  function applyTyped(value: string) {
    setTyped(value);
    const match = value.trim().match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/);
    if (!match) {
      setTypedError(value.trim() ? "Use DD / MM / YYYY." : null);
      return;
    }
    const iso = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    const check = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(check.getTime()) || check.getDate() !== Number(match[1])) return setTypedError("That date doesn’t exist.");
    if (iso < todayIso) return setTypedError("Pick today or a later day. Past days are never changed.");
    setTypedError(null);
    setSelected(iso);
    setOffset((check.getFullYear() - base.getFullYear()) * 12 + check.getMonth() - base.getMonth());
  }

  const lastFree = blocks && blocks.length ? endTime(blocks[blocks.length - 1].to, 0) : null;

  return (
    <>
      <SubHeader backHref={go("schedTask", `task=${item.taskId}`)} backLabel="Back to task" kicker={`Schedule · ${item.title}`} title="Choose a day, your way." subtitle="Tap a day, or type a date. Dots mean you already have plans." />
      <Split
        left={
          <>
            <section className="rounded-[24px] bg-surface p-4 shadow-raised">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-heading font-extrabold text-text">{shown.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
                <span className="flex gap-4 font-heading text-heading font-bold text-accent-strong">
                  <button type="button" aria-label="Previous month" disabled={offset === 0} onClick={() => setOffset(offset - 1)} className="disabled:opacity-30">
                    ‹
                  </button>
                  <button type="button" aria-label="Next month" disabled={offset >= 11} onClick={() => setOffset(offset + 1)} className="disabled:opacity-30">
                    ›
                  </button>
                </span>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-y-2 text-center">
                {["M", "T", "W", "T", "F", "S", "S"].map((letter, index) => (
                  <span key={index} className="font-heading text-meta text-text-muted">
                    {letter}
                  </span>
                ))}
                {monthCells(shown.getFullYear(), shown.getMonth()).map((iso, index) => {
                  if (!iso) return <span key={`b-${index}`} />;
                  const past = iso < todayIso;
                  const isSelected = iso === selected;
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={past}
                      aria-pressed={isSelected}
                      aria-label={`${dayLong(iso)}${busyDays.includes(iso) ? ", has plans" : ""}`}
                      onClick={() => setSelected(iso)}
                      className="flex flex-col items-center gap-0.5 disabled:cursor-default"
                    >
                      <span className={cn("grid h-9 w-9 place-items-center rounded-full font-heading text-body font-bold", isSelected ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : past ? "text-text-muted/60" : "text-text")}>
                        {Number(iso.slice(8))}
                      </span>
                      <span className={cn("h-1.5 w-1.5 rounded-full", busyDays.includes(iso) && !past ? "bg-accent" : "bg-transparent")} />
                    </button>
                  );
                })}
              </div>
            </section>
            <label className="block">
              <span className="mb-2 block font-heading text-body font-bold text-text">Or type a date</span>
              <span className="flex items-center gap-3 rounded-[22px] bg-surface px-5 py-3.5 shadow-raised">
                <input value={typed} inputMode="numeric" onChange={(event) => applyTyped(event.target.value)} placeholder="16 / 11 / 2026" className="min-w-0 flex-1 bg-transparent font-heading text-body text-text outline-none placeholder:text-text-muted" />
                <span className="font-heading text-meta font-bold text-accent-strong">DD / MM / YYYY</span>
              </span>
              {typedError ? (
                <span role="alert" className="mt-1 block font-heading text-meta text-warning">
                  {typedError}
                </span>
              ) : null}
            </label>
          </>
        }
        right={
          <>
            <Panel title={`Already on ${dayShort(selected)}`}>
              {blocks === null ? (
                <Skeleton className="h-20" />
              ) : blocks.length === 0 ? (
                <p className="py-3 font-heading text-body text-text-muted">A clear day.</p>
              ) : (
                <ul className="divide-y divide-outline">
                  {blocks.map((block) => (
                    <li key={`${block.title}-${block.from}`} className="flex items-center gap-3 py-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">{block.note === "squad" ? <PlayIcon className="h-5 w-5" /> : <ReadIcon className="h-5 w-5" />}</span>
                      <span>
                        <span className="block font-heading text-body font-bold text-text">{block.title}</span>
                        <span className="block font-heading text-meta text-text-muted">
                          {block.from}–{block.to}
                          {block.note ? ` · ${block.note}` : ""}
                        </span>
                      </span>
                    </li>
                  ))}
                  {lastFree ? (
                    <li className="flex items-center gap-3 py-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-success-tint text-success">
                        <SparkleIcon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block font-heading text-body font-bold text-text">Free from {lastFree < "17:00" ? "17:00" : lastFree}</span>
                        <span className="block font-heading text-meta text-text-muted">A good spot for something small</span>
                      </span>
                    </li>
                  ) : null}
                </ul>
              )}
            </Panel>
            <Primary onClick={() => router.push(go("schedTime", `task=${item.taskId}&date=${selected}`))}>Next: pick a time</Primary>
            <Secondary to={go("scheduler")}>Keep unscheduled</Secondary>
          </>
        }
      />
    </>
  );
}

function ChooseTime({ item, todayIso, face }: { item: SchedulerItem; todayIso: string; face: Parameters<typeof AriSays>[0]["face"] }) {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("date");
  const initialDate = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested >= todayIso ? requested : todayIso;
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(item.time ?? "17:30");
  const [repeats, setRepeats] = useState(item.repeatsDaily);
  const [blocks, setBlocks] = useState<BusyBlock[]>([]);
  const [result, setResult] = useState<SlotCheck | null>(null);
  const week = weekDates(date, 0);

  useEffect(() => {
    let alive = true;
    void getBusy(date, item.taskId).then((value) => {
      if (alive) setBlocks(value);
    });
    return () => {
      alive = false;
    };
  }, [date, item.taskId]);

  const choices = ["07:00", "09:00", "12:30", "17:30"];
  const taken = (choice: string) => blocks.find((block) => choice >= block.from && choice < block.to);
  const weekday = new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });

  async function review(candidate: string) {
    const check = await checkSlot(item.taskId, date, candidate.trim());
    setResult(check);
    if (check.ok) router.push(go("schedReview", `task=${item.taskId}&date=${date}&time=${candidate.trim()}&repeat=${repeats ? "daily" : "once"}`));
  }

  // Invalid time: a focused screen to put it right.
  if (result?.reason === "invalid") {
    return (
      <>
        <SubHeader backHref={go("schedDay", `task=${item.taskId}`)} backLabel="Back to day" kicker="Schedule · Check the time" title="Let’s find a valid time." subtitle={`${item.title} is still unscheduled.`} />
        <Split
          left={
            <>
              <label className="block">
                <span className="mb-2 block font-heading text-body font-bold text-text">Start time</span>
                <input value={time} onChange={(event) => setTime(event.target.value)} aria-invalid className="w-full rounded-[22px] bg-surface px-5 py-4 font-heading text-body text-text shadow-raised outline outline-2 outline-[#c9822f]" />
                <span role="alert" className="mt-1 block font-heading text-meta text-[#9a5b12]">
                  Use a 24-hour time, like 17:30.
                </span>
              </label>
              <div>
                <p className="mb-2 font-heading text-body font-bold text-text">Or tap one</p>
                <div className="flex gap-2">
                  {choices
                    .filter((choice) => !taken(choice))
                    .map((choice) => (
                      <button key={choice} type="button" onClick={() => setTime(choice)}>
                        <Pill selected={time === choice}>{choice}</Pill>
                      </button>
                    ))}
                </div>
              </div>
            </>
          }
          right={
            <>
              <Note>Your date, length and repeat choices are kept. Nothing was changed.</Note>
              <Primary onClick={() => void review(/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : result.suggestion ?? "17:30")}>
                {`Use ${/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : result.suggestion ?? "17:30"}`}
              </Primary>
              <Secondary to={go("scheduler")}>Keep unscheduled</Secondary>
            </>
          }
        />
      </>
    );
  }

  const conflict = result?.reason === "conflict" ? result : null;

  return (
    <>
      <SubHeader
        backHref={go("schedDay", `task=${item.taskId}`)}
        backLabel="Back to day"
        kicker={conflict ? "Schedule · Conflict" : `Schedule · ${item.title}`}
        title={conflict ? "That time is already taken." : "Choose a time that fits."}
        subtitle={conflict ? "Nothing has moved." : "Tap a day and a time. No dragging needed."}
      />
      <Split
        from="md"
        left={
          <>
            <WeekStrip
              week={week}
              selected={date}
              onSelect={(iso) => {
                if (iso < todayIso) return;
                setDate(iso);
                setResult(null);
              }}
            />
            {conflict?.conflict ? (
              <Note tone="warm" title={`${time} overlaps ${conflict.conflict.title}`}>
                {`That runs ${conflict.conflict.from}–${conflict.conflict.to}. ${item.title} would overlap it.`}
              </Note>
            ) : (
              <div>
                <p className="mb-2 font-heading text-body font-bold text-text">Open times on {weekday}</p>
                <div className="flex flex-wrap gap-2">
                  {choices.map((choice) => {
                    const busy = taken(choice);
                    return (
                      <button
                        key={choice}
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => {
                          setTime(choice);
                          setResult(null);
                        }}
                        className="disabled:opacity-50"
                      >
                        <Pill selected={time === choice}>{busy ? `${choice} · busy` : choice}</Pill>
                      </button>
                    );
                  })}
                </div>
                {choices.some(taken) ? (
                  <p className="mt-2 font-heading text-meta text-text-muted">
                    {choices
                      .filter(taken)
                      .map((choice) => `${choice} is taken by ${taken(choice)?.title}.`)
                      .join(" ")}
                  </p>
                ) : null}
              </div>
            )}
          </>
        }
        right={
          <>
            <DayAgenda date={date} blocks={blocks} title={item.title} time={time} minutes={item.minutes} />
            <label className="block">
              <span className="mb-2 block font-heading text-body font-bold text-text">Start time</span>
              <span className={cn("flex items-center gap-3 rounded-[22px] bg-surface px-5 py-3.5 shadow-raised outline outline-2", conflict ? "outline-[#c9822f]" : "outline-accent")}>
                <input
                  value={time}
                  maxLength={5}
                  aria-invalid={Boolean(conflict)}
                  onChange={(event) => {
                    setTime(event.target.value);
                    setResult(null);
                  }}
                  className="min-w-0 flex-1 bg-transparent font-heading text-body text-text outline-none"
                />
                {/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? <span className="font-heading text-meta text-accent-strong">Ends {endTime(time, item.minutes)}</span> : null}
              </span>
              {conflict ? <span className="mt-1 block font-heading text-meta text-[#9a5b12]">Pick another time, or keep it unscheduled.</span> : null}
            </label>
            {conflict?.suggestion ? <AriSays face={face}>{`${conflict.suggestion} is free. Try that?`}</AriSays> : null}
            {conflict ? null : (
              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-2 font-heading text-body font-bold text-text">Repeats</legend>
                <div role="radiogroup" aria-label="Repeats" className="flex flex-wrap gap-2">
                  <button type="button" role="radio" aria-checked={!repeats} onClick={() => setRepeats(false)}>
                    <Pill selected={!repeats}>Just this day</Pill>
                  </button>
                  <button type="button" role="radio" aria-checked={repeats} onClick={() => setRepeats(true)}>
                    <Pill selected={repeats}>{`Every day from ${dayShort(date)}`}</Pill>
                  </button>
                </div>
              </fieldset>
            )}
            {conflict?.suggestion ? (
              <Primary
                onClick={() => {
                  setTime(conflict.suggestion as string);
                  void review(conflict.suggestion as string);
                }}
              >
                {`Use ${conflict.suggestion}–${endTime(conflict.suggestion, item.minutes)}`}
              </Primary>
            ) : (
              <Primary onClick={() => void review(time)}>Review &amp; save</Primary>
            )}
            {conflict ? <Secondary onClick={() => setResult(null)}>Choose another time</Secondary> : <Secondary to={go("scheduler")}>Keep unscheduled</Secondary>}
          </>
        }
      />
    </>
  );
}

/** Tablet (Figma 06e): the chosen day's agenda beside the form, with the new task slotted in. */
function DayAgenda({ date, blocks, title, time, minutes }: { date: string; blocks: BusyBlock[]; title: string; time: string; minutes: number }) {
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  const rows = [
    ...blocks.map((block) => ({ key: `${block.title}-${block.from}`, time: block.from, title: block.title, detail: `${block.from}–${block.to}${block.note ? ` · ${block.note}` : ""}`, isNew: false })),
    ...(valid ? [{ key: "new", time, title, detail: "New · not saved yet", isNew: true }] : []),
  ].sort((a, b) => a.time.localeCompare(b.time));
  return (
    <section className="hidden md:block">
      <Panel title={`${dayShort(date)} · your day`}>
        <ul className="divide-y divide-outline">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center gap-3 py-3">
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", row.isNew ? "bg-success-tint text-success" : "bg-accent-tint text-accent-strong")}>
                {row.isNew ? <SparkleIcon className="h-5 w-5" /> : <ReadIcon className="h-5 w-5" />}
              </span>
              <span className="flex-1">
                <span className="block font-heading text-body font-bold text-text">
                  {row.time} {row.title}
                </span>
                <span className="block font-heading text-meta text-text-muted">{row.detail}</span>
              </span>
              {row.isNew ? <span className="rounded-full bg-success-tint px-3 py-1 font-heading text-meta font-bold text-success">New</span> : null}
            </li>
          ))}
        </ul>
      </Panel>
      <p className="sr-only">{`${title} would take ${minutes} minutes.`}</p>
    </section>
  );
}

function ReviewSchedule({ item, date, time, repeats, onSave }: { item: SchedulerItem; date: string; time: string; repeats: boolean; onSave: (repeatsDaily: boolean) => Promise<void> }) {
  const [daily, setDaily] = useState(repeats);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <SubHeader backHref={go("schedTime", `task=${item.taskId}&date=${date}`)} backLabel="Back to time" kicker="Schedule · Review" title="A little room, reserved." subtitle="Check it before it goes into Planner." />
      <Split
        left={
          <Panel title={item.title}>
            <ul className="divide-y divide-outline">
              <li className="flex items-center gap-3 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">
                  <CalendarIcon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-heading text-body font-bold text-text">{dayLong(date)}</span>
                  <span className="block font-heading text-meta text-text-muted">
                    {time}–{endTime(time, item.minutes)} · local time
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-3 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">
                  <ReadIcon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-heading text-body font-bold text-text">{daily ? "Repeats every day" : "Just this day"}</span>
                  <span className="block font-heading text-meta text-text-muted">Personal · {item.priority[0].toUpperCase() + item.priority.slice(1)}</span>
                </span>
              </li>
              {item.goalName ? (
                <li className="flex items-center gap-3 py-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">
                    <SparkleIcon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-heading text-body font-bold text-text">Linked, not duplicated</span>
                    <span className="block font-heading text-meta text-text-muted">{item.goalName}</span>
                  </span>
                </li>
              ) : null}
            </ul>
          </Panel>
        }
        right={
          <>
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2 font-heading text-body font-bold text-text">Apply this time to</legend>
              <div role="radiogroup" aria-label="Apply this time to" className="flex flex-wrap gap-2">
                <button type="button" role="radio" aria-checked={!daily} onClick={() => setDaily(false)}>
                  <Pill selected={!daily}>{`Only ${dayShort(date)}`}</Pill>
                </button>
                <button type="button" role="radio" aria-checked={daily} onClick={() => setDaily(true)}>
                  <Pill selected={daily}>{`${dayShort(date)} and every day after`}</Pill>
                </button>
              </div>
              <p className="mt-2 font-heading text-meta text-text-muted">Past days are never changed.</p>
            </fieldset>
            {error ? (
              <p role="alert" className="font-heading text-label text-warning">
                {error}
              </p>
            ) : null}
            <Primary
              disabled={busy}
              onClick={() => {
                setBusy(true);
                setError(null);
                onSave(daily)
                  .catch((err: unknown) => setError(err instanceof Error ? err.message : "Couldn’t save. Try again."))
                  .finally(() => setBusy(false));
              }}
            >
              Save to Planner
            </Primary>
            <Secondary to={go("schedTime", `task=${item.taskId}&date=${date}`)}>Edit time</Secondary>
          </>
        }
      />
    </>
  );
}

