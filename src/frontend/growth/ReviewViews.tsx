"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { STAGE_ART } from "../companion";
import { CheckOrb, Skeleton } from "../components";
import { AriTile, Split } from "../habits/views";
import { useShell } from "../home/AppShell";
import { CheckIcon, MoveIcon, SparkleIcon } from "../home/icons";
import { useToday } from "../hooks";
import { cn } from "../lib/cn";
import { OBSTACLES, getReview, saveReview } from "./liveStudio";
import type { ReviewChange, ReviewState } from "../mocks/types";
import { Badge, Panel, Pill, SubHeader } from "../planner/parts";

export type ReviewView = "review" | "review1" | "review2" | "review3" | "review4" | "reviewSaved";
export const REVIEW_VIEWS: ReviewView[] = ["review", "review1", "review2", "review3", "review4", "reviewSaved"];

const go = (view: ReviewView) => `/growth?view=${view}`;

function shortRange(from: string, to: string): string {
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  const month = (date: Date) => date.toLocaleDateString("en-GB", { month: "short" });
  return a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${month(b)}` : `${a.getDate()} ${month(a)}–${b.getDate()} ${month(b)}`;
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
function Note({ tone = "tint", title, children }: { tone?: "tint" | "success"; title?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-[22px] p-4", tone === "success" ? "bg-success-tint" : "bg-accent-tint")}>
      {title ? <p className={cn("font-heading text-body font-bold", tone === "success" ? "text-success" : "text-accent-strong")}>{title}</p> : null}
      <p className={cn("font-heading text-label text-text", title ? "mt-1" : "")}>{children}</p>
    </section>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <section className="rounded-[24px] bg-surface p-5 shadow-raised">
      <div className="flex items-baseline justify-between">
        <p className="font-heading text-body font-bold text-text">Review</p>
        <p className="font-heading text-meta font-bold text-accent-strong">{step} of 4</p>
      </div>
      <div className="mt-3 h-2.5 rounded-full bg-accent-tint shadow-inset" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={step} aria-label="Review progress">
        <span className="block h-full rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${(step / 4) * 100}%` }} />
      </div>
    </section>
  );
}

const CHANGE_ICON: Record<ReviewChange["kind"], ReactNode> = {
  keep: <CheckIcon className="h-5 w-5" />,
  smaller: <MoveIcon className="h-5 w-5" />,
  new: <SparkleIcon className="h-5 w-5" />,
};
const CHANGE_LABEL: Record<ReviewChange["kind"], string> = { keep: "Keep", smaller: "Smaller", new: "New" };

/** Figma 06c · Growth Studio · 15-day review. About five minutes; only you see it. */
export function ReviewViews({ view }: { view: ReviewView }) {
  const router = useRouter();
  const { showToast } = useShell();
  const today = useToday();
  const art = STAGE_ART[today.data?.companion.stage ?? "teen"];
  const [review, setReview] = useState<ReviewState | null>(null);
  const [obstacles, setObstacles] = useState<string[] | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [kept, setKept] = useState<Record<string, boolean>>({});
  const [moved, setMoved] = useState("");
  const [changes, setChanges] = useState<ReviewChange[] | null>(null);
  const [newIdea, setNewIdea] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void getReview().then((result) => {
      if (alive) setReview(result);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!review) return <Skeleton className="h-96 rounded-[28px]" />;
  const r = review;
  const chosenObstacles = obstacles ?? r.obstacles;
  const contextText = context ?? r.context;
  const changeList = changes ?? r.suggestions;
  const newTitle = newIdea ?? changeList.find((change) => change.kind === "new")?.title ?? "";

  async function persist(finish: boolean) {
    setBusy(true);
    setError(null);
    try {
      const list = changeList.map((change) => (change.kind === "new" ? { ...change, title: newTitle } : change));
      const next = await saveReview({ obstacles: chosenObstacles, context: contextText, changes: list, finish });
      setReview(next);
      setChanges(null);
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t save. Your answers are still here.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  // Once saved, the review stays saved: every step shows the result.
  const current: ReviewView = r.status === "saved" ? "reviewSaved" : view;

  switch (current) {
    case "review1":
      return (
        <>
          <SubHeader backHref={go("review")} backLabel="Back" kicker="15-day review · 1 of 4" title="Small efforts count." subtitle="What you tried this cycle. Not a score." />
          <Split
            left={
              <>
                <Progress step={1} />
                <Panel title="Tried">
                  <ul className="divide-y divide-outline">
                    {r.tried.map((item) => (
                      <li key={item.title} className="flex items-center gap-3 py-3">
                        <CheckOrb id={`tried-${item.title}`} size="sm" label={item.title} checked disabled onChange={() => undefined} />
                        <span>
                          <span className="block font-heading text-body font-bold text-text">{item.title}</span>
                          <span className="block font-heading text-meta text-text-muted">{item.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </>
            }
            right={
              <>
                {r.notTried.length ? (
                  <Panel title="Not tried yet · that’s okay">
                    <ul className="divide-y divide-outline">
                      {r.notTried.map((item) => (
                        <li key={item.title} className="flex items-center gap-3 py-3">
                          <CheckOrb id={`not-${item.title}`} size="sm" label={item.title} checked={false} disabled onChange={() => undefined} />
                          <span>
                            <span className="block font-heading text-body font-bold text-text">{item.title}</span>
                            <span className="block font-heading text-meta text-text-muted">{item.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                ) : null}
                <Primary to={go("review2")}>Next: what got in the way</Primary>
              </>
            }
          />
        </>
      );

    case "review2":
      return (
        <>
          <SubHeader backHref={go("review1")} backLabel="Back" kicker="15-day review · 2 of 4" title="What got in the way?" subtitle="Naming a barrier is useful. It isn’t a failure." />
          <Split
            left={
              <>
                <Progress step={2} />
                <fieldset className="m-0 border-0 p-0">
                  <legend className="mb-2 font-heading text-body font-bold text-text">Choose any that fit · optional</legend>
                  <div className="flex flex-wrap gap-2">
                    {OBSTACLES.map((item) => {
                      const on = chosenObstacles.includes(item);
                      return (
                        <button key={item} type="button" aria-pressed={on} onClick={() => setObstacles(on ? chosenObstacles.filter((entry) => entry !== item) : [...chosenObstacles, item])}>
                          <Pill selected={on}>{item}</Pill>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </>
            }
            right={
              <>
                <label className="block">
                  <span className="mb-2 block font-heading text-body font-bold text-text">A little context · optional</span>
                  <span className="flex items-center gap-3 rounded-[22px] bg-surface px-5 py-3.5 shadow-raised outline outline-2 outline-accent">
                    <input value={contextText} maxLength={280} onChange={(event) => setContext(event.target.value)} placeholder="Evenings were busier than I expected." className="min-w-0 flex-1 bg-transparent font-heading text-body text-text outline-none placeholder:text-text-muted" />
                    <span className="font-heading text-meta font-bold text-accent-strong">Private</span>
                  </span>
                </label>
                <Note>Your answers are never copied to your squad.</Note>
                <Primary onClick={() => void persist(false).then((next) => next && router.push(go("review3")))}>Next: what to keep</Primary>
                <Secondary to={go("review3")}>Skip this step</Secondary>
              </>
            }
          />
        </>
      );

    case "review3":
      return (
        <>
          <SubHeader backHref={go("review2")} backLabel="Back" kicker="15-day review · 3 of 4" title="What helped you move?" subtitle="Keep what worked. Let go of what didn’t, kindly." />
          <Split
            left={
              <>
                <Progress step={3} />
                <Panel title="Your actions this cycle">
                  <ul className="divide-y divide-outline">
                    {r.tried.map((item) => {
                      const keep = kept[item.title] ?? true;
                      return (
                        <li key={item.title} className="py-3">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="font-heading text-body font-bold text-text">{item.title}</span>
                            <span className="font-heading text-meta text-text-muted">{item.detail}</span>
                          </div>
                          <div role="radiogroup" aria-label={`${item.title}: keep or let go`} className="mt-2 flex rounded-full bg-accent-tint/70 p-1 shadow-inset">
                            {[
                              [true, "Keep it"],
                              [false, "Let it go"],
                            ].map(([value, label]) => (
                              <button
                                key={String(value)}
                                type="button"
                                role="radio"
                                aria-checked={keep === value}
                                onClick={() => setKept({ ...kept, [item.title]: value as boolean })}
                                className={cn("flex-1 rounded-full py-2 font-heading text-label", keep === value ? "bg-[image:var(--gradient-primary)] font-bold text-white shadow-pressable" : "text-text-muted")}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
              </>
            }
            right={
              <>
                <label className="block rounded-[24px] bg-surface p-4 shadow-raised">
                  <span className="flex items-center gap-2 font-heading text-body font-bold text-text">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-meta text-white">1</span>
                    What moved me forward?
                  </span>
                  <textarea value={moved} maxLength={280} rows={3} onChange={(event) => setMoved(event.target.value)} placeholder="Write a sentence or two…" className="mt-3 w-full resize-none rounded-[16px] bg-accent-tint/40 p-3 font-heading text-body text-text outline-none placeholder:text-text-muted" />
                </label>
                <Primary
                  onClick={() => {
                    const letGo = r.tried.filter((item) => kept[item.title] === false).map((item) => item.title);
                    setChanges(changeList.filter((change) => !(change.kind === "keep" && letGo.includes(change.title))));
                    router.push(go("review4"));
                  }}
                >
                  Next: adjust the plan
                </Primary>
              </>
            }
          />
        </>
      );

    case "review4":
      return (
        <>
          <SubHeader backHref={go("review3")} backLabel="Back" kicker="15-day review · 4 of 4" title="Adjust the plan, not your worth." subtitle="Goal: Become a confident developer" />
          <Split
            left={
              <>
                <Progress step={4} />
                <Panel title="For next cycle">
                  <ul className="divide-y divide-outline">
                    {changeList.map((change) => (
                      <li key={change.id} className="flex items-center gap-3 py-3">
                        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", change.kind === "keep" ? "bg-success-tint text-success" : "bg-accent-tint text-accent-strong")}>{CHANGE_ICON[change.kind]}</span>
                        <span className="min-w-0 flex-1">
                          {change.kind === "new" ? (
                            <input value={newTitle} maxLength={80} aria-label="New action" onChange={(event) => setNewIdea(event.target.value)} className="w-full rounded-full bg-accent-tint/40 px-3 py-1 font-heading text-body font-bold text-text" />
                          ) : (
                            <span className="block font-heading text-body font-bold text-text">
                              {CHANGE_LABEL[change.kind]} · {change.title}
                            </span>
                          )}
                          <span className="block font-heading text-meta text-text-muted">{change.detail}</span>
                        </span>
                        <button type="button" aria-label={`Remove ${change.title}`} onClick={() => setChanges(changeList.filter((entry) => entry.id !== change.id))}>
                          {change.kind === "keep" ? <span className="rounded-full bg-success-tint px-3 py-1 font-heading text-meta font-bold text-success">Keep</span> : <Badge>Draft</Badge>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </>
            }
            right={
              <>
                <div className="flex items-start gap-3">
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-cream ring-[3px] ring-white">
                    <Image src={art.face} alt="Ari" width={44} height={44} className="h-full w-full object-cover" />
                  </span>
                  <p className="rounded-[18px] rounded-tl-md bg-surface px-4 py-3 font-heading text-label text-text shadow-raised">Smaller is still forward. I’ll be there either way.</p>
                </div>
                <Note>Changes stay drafts until you accept them. History isn’t rewritten.</Note>
                {error ? (
                  <p role="alert" className="font-heading text-label text-warning">
                    {error}
                  </p>
                ) : null}
                <Primary disabled={busy} onClick={() => void persist(true).then((next) => next && router.push(go("reviewSaved")))}>
                  Save review
                </Primary>
                <Secondary
                  onClick={() =>
                    void persist(false).then((next) => {
                      if (!next) return;
                      showToast("Saved as a draft. Pick it up any time.");
                      router.push("/growth");
                    })
                  }
                >
                  Save draft &amp; leave
                </Secondary>
              </>
            }
          />
        </>
      );

    case "reviewSaved": {
      const drafts = r.suggestions.filter((change) => change.kind !== "keep");
      return (
        <>
          <SubHeader backHref="/growth" backLabel="Back to Growth Studio" kicker="15-day review · Saved" title="Begin again, a little wiser." subtitle={`Next cycle: ${shortRange(r.nextFrom, r.nextTo)}`} />
          <Split
            left={
              <AriTile art={art.full} label="Review saved · Private" title="A little clearer. Ready again." body="Your reflections stay private. Ari’s growth is unchanged.">
                {r.xpAwarded ? <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">+{r.xpAwarded} XP</span> : null}
              </AriTile>
            }
            right={
              <>
                {drafts.length ? (
                  <Panel title={`${drafts.length} draft ${drafts.length === 1 ? "change" : "changes"} to consider`}>
                    <ul className="divide-y divide-outline">
                      {drafts.map((change) => (
                        <li key={change.id}>
                          <Link href={change.draftActionId ? `/growth?view=action&action=${change.draftActionId}` : "/growth?view=grid"} className="flex items-center gap-3 py-3">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">{CHANGE_ICON[change.kind]}</span>
                            <span className="flex-1">
                              <span className="block font-heading text-body font-bold text-text">{change.title}</span>
                              <span className="block font-heading text-meta text-text-muted">{change.kind === "smaller" ? "Smaller version" : "New action"}</span>
                            </span>
                            <Badge>Accept</Badge>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                ) : null}
                <Primary to="/growth?view=rhythms">Review my drafts</Primary>
                <Secondary to="/growth">Back to Growth Studio</Secondary>
                <Note>Want your squad to know? Sharing “review done” is optional. Your words never go with it.</Note>
              </>
            }
          />
        </>
      );
    }

    default:
      return (
        <>
          <SubHeader backHref="/growth" backLabel="Back to Growth Studio" kicker={`15-day review · ${shortRange(r.from, r.to)}`} title="Pause. Notice. Adjust." subtitle="About 5 minutes. Only you will see it." />
          <Split
            left={<AriTile art={art.full} label={`Cycle ${r.cycle} is done`} title="What helped you move forward?" body="Look at what you tried, what got in the way, and what to change next." />}
            right={
              <>
                <div className="flex gap-3">
                  {[
                    [`${r.stats.tried} / ${r.stats.total}`, "actions tried"],
                    [String(r.stats.daysActive), "days active"],
                    [`+${r.stats.xpEarned}`, "XP earned"],
                  ].map(([value, label]) => (
                    <div key={label} className="flex flex-1 flex-col items-center rounded-[22px] bg-surface py-5 shadow-raised">
                      <span className="font-display text-title font-extrabold text-text">{value}</span>
                      <span className="font-heading text-meta text-text-muted">{label}</span>
                    </div>
                  ))}
                </div>
                <Note tone="success" title="No lost progress">A review isn’t a test. Skipping or delaying it never takes Ari’s growth away.</Note>
                <Primary to={go("review1")}>Start my review</Primary>
                <Secondary
                  onClick={() => {
                    showToast("We’ll remind you tomorrow. Nothing is lost.");
                    router.push("/growth");
                  }}
                >
                  Remind me tomorrow
                </Secondary>
              </>
            }
          />
        </>
      );
  }
}
