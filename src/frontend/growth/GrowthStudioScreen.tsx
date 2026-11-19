"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { STAGE_ART } from "../companion";
import { CheckOrb, Skeleton } from "../components";
import { AriTile, Split } from "../habits/views";
import { useShell } from "../home/AppShell";
import { CalendarIcon, ChevronRightIcon, MoveIcon, PlayIcon, ReadIcon, SparkleIcon, WaterIcon } from "../home/icons";
import { usePlanner, useToday } from "../hooks";
import { cn } from "../lib/cn";
import {
  acceptAllRhythms,
  acceptGridAction,
  answerQuestion,
  getGrowthStudio,
  rateArea,
  renameGridArea,
  saveAuditAreas,
  saveGridAction,
  setActionRhythm,
  setCentralGoal,
  applySuggestedGrid,
} from "../mocks/repository";
import type { ActionRhythm, AuditArea, AuditIcon, GridAction, GrowthStudioState } from "../mocks/types";
import { Badge, Panel, Pill, SubHeader } from "../planner/parts";

type View =
  | "hub"
  | "welcome"
  | "areas"
  | "rate"
  | "question"
  | "editAreas"
  | "summary"
  | "central"
  | "suggested"
  | "grid"
  | "area"
  | "action"
  | "rhythms"
  | "accept"
  | "acceptHabit";

const VIEWS: View[] = ["hub", "welcome", "areas", "rate", "question", "editAreas", "summary", "central", "suggested", "grid", "area", "action", "rhythms", "accept", "acceptHabit"];

const go = (view: View, extra = "") => (view === "hub" ? "/growth" : `/growth?view=${view}${extra ? `&${extra}` : ""}`);

const RATINGS = [
  { value: 1, label: "Needs room" },
  { value: 2, label: "Some room" },
  { value: 3, label: "Steady" },
  { value: 4, label: "Feels good" },
  { value: 5, label: "Well supported" },
];

const AREA_ICON: Record<AuditIcon, { icon: ReactNode; tone: string }> = {
  rest: { icon: <MoveIcon className="h-5 w-5" />, tone: "bg-[#fdeedd] text-[#9a5b12]" },
  learning: { icon: <ReadIcon className="h-5 w-5" />, tone: "bg-success-tint text-success" },
  work: { icon: <CalendarIcon className="h-5 w-5" />, tone: "bg-accent-tint text-accent-strong" },
  people: { icon: <SparkleIcon className="h-5 w-5" />, tone: "bg-accent-tint text-accent-strong" },
  health: { icon: <WaterIcon className="h-5 w-5" />, tone: "bg-accent-tint text-accent-strong" },
  money: { icon: <SparkleIcon className="h-5 w-5" />, tone: "bg-accent-tint text-accent-strong" },
  home: { icon: <CalendarIcon className="h-5 w-5" />, tone: "bg-accent-tint text-accent-strong" },
  spark: { icon: <SparkleIcon className="h-5 w-5" />, tone: "bg-accent-tint text-accent-strong" },
};

const RHYTHMS: { value: Exclude<ActionRhythm, "once">; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "seasonal", label: "Seasonal" },
];

function shortAreaName(area: AuditArea): string {
  return area.name.split(" ")[0].replace(/&$/, "");
}

function ratingLabel(rating: number | null): string {
  return RATINGS.find((item) => item.value === rating)?.label ?? "Not reflected on";
}

function destination(action: Pick<GridAction, "rhythm" | "addAs">): string {
  if (action.addAs === "habit") return "Habit Tracker";
  return action.rhythm === "once" ? "Planner" : "Planner, as a repeating task";
}

function errorText(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Try again.";
}

// ------------------------------------------------------------------ parts

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
    <section className={cn("rounded-[22px] p-4", bg)}>
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

function Choice<T extends string | number>({ legend, value, options, onChange }: { legend: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2 font-heading text-body font-bold text-text">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={String(option.value)} type="button" role="radio" aria-checked={option.value === value} onClick={() => onChange(option.value)}>
            <Pill selected={option.value === value}>{option.label}</Pill>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ErrorLine({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="font-heading text-label text-warning">
      {message}
    </p>
  ) : null;
}

function AreaIcon({ icon }: { icon: AuditIcon }) {
  const item = AREA_ICON[icon];
  return <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", item.tone)}>{item.icon}</span>;
}

/** The 3×3 Harada grid: eight areas around the central goal. */
function MiniGrid({ state, selectedId, compact }: { state: GrowthStudioState; selectedId?: string; compact?: boolean }) {
  const grid = state.grid;
  if (!grid) return null;
  const cells = [...grid.areas.slice(0, 4), null, ...grid.areas.slice(4, 8)];
  return (
    <div className="grid grid-cols-3 gap-2 rounded-[24px] bg-surface p-3 shadow-raised">
      {cells.map((area, index) => {
        if (!area) {
          return (
            <div key={`goal-${index}`} className="flex flex-col justify-center rounded-[16px] bg-[linear-gradient(160deg,#8a63e0,#4c319b)] p-2.5 text-white shadow-pressable">
              <span className="font-heading text-[11px] tracking-wide text-white/75 uppercase">Your goal</span>
              <span className="line-clamp-3 font-heading text-label font-bold">{grid.goalTitle}</span>
            </div>
          );
        }
        const count = grid.actions.filter((action) => action.areaId === area.id).length;
        return (
          <Link
            key={area.id}
            href={go("area", `area=${area.id}`)}
            className={cn(
              "flex flex-col justify-between rounded-[16px] border-2 p-2.5",
              compact ? "min-h-[72px]" : "min-h-[96px]",
              area.id === selectedId ? "border-accent bg-accent-tint" : area.isDraft ? "border-dashed border-outline" : "border-transparent bg-[#f7f3fd]",
            )}
          >
            <span className="font-heading text-label font-bold text-text">{area.name}</span>
            <span className="font-heading text-meta text-text-muted">
              {count} {count === 1 ? "action" : "actions"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ screen

/** Figma 06 · Growth Studio · Find your direction. Everything stays a private draft until accepted. */
export function GrowthStudioScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { showToast } = useShell();
  const today = useToday();
  const planner = usePlanner();
  const [state, setState] = useState<GrowthStudioState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void getGrowthStudio().then((result) => {
      if (alive) setState(result);
    });
    return () => {
      alive = false;
    };
  }, []);

  const raw = params.get("view");
  const view: View = VIEWS.includes(raw as View) ? (raw as View) : "hub";
  const art = STAGE_ART[today.data?.companion.stage ?? "teen"];

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <Main>
        <Skeleton className="h-96 rounded-[28px]" />
      </Main>
    );
  }

  const s = state;
  const reflected = s.areas.filter((area) => area.rating !== null);
  const notYet = s.areas.filter((area) => area.rating === null);
  const answered = s.questions.filter((question) => question.answer.trim()).length;
  const grid = s.grid;
  const drafts = grid?.actions.filter((action) => action.status !== "accepted") ?? [];
  const accepted = grid?.actions.filter((action) => action.status === "accepted") ?? [];
  const namedAreas = grid?.areas.filter((area) => !area.isDraft).length ?? 0;
  const paused = s.areas.find((area) => area.id === s.lastPausedAreaId) ?? notYet[0] ?? null;
  const key = `${view}-${params.get("area") ?? ""}-${params.get("action") ?? ""}-${params.get("q") ?? ""}`;

  let body: ReactNode;
  switch (view) {
    case "welcome":
      body = (
        <>
          <SubHeader backHref="/growth" backLabel="Back to Growth Studio" kicker="Growth Studio · Returning" title="Welcome back to your direction." subtitle="Your private draft is right where you left it." />
          <Split
            left={
              <>
                <AriTile art={art.full} label="With Ari" title={paused ? `We paused on ${shortAreaName(paused)} last time.` : "Your audit is complete."} body="Pick it up, or look at your goal grid. No rush either way.">
                  <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">Private</span>
                </AriTile>
                <section className="rounded-[24px] bg-surface p-5 shadow-raised">
                  <div className="flex items-baseline justify-between">
                    <p className="font-heading text-body font-bold text-text">Life Audit</p>
                    <p className="font-heading text-meta font-bold text-accent-strong">
                      {reflected.length} of {s.areas.length} areas
                    </p>
                  </div>
                  <div className="mt-3 h-2.5 rounded-full bg-accent-tint shadow-inset">
                    <span className="block h-full rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${(reflected.length / Math.max(1, s.areas.length)) * 100}%` }} />
                  </div>
                  <p className="mt-2 font-heading text-meta text-text-muted">Edit, skip or rename areas anytime. No overall grade.</p>
                </section>
              </>
            }
            right={
              <>
                <Panel title="Continue">
                  <ul className="divide-y divide-outline">
                    <RowLink to={paused ? go("rate", `area=${paused.id}`) : go("summary")} icon={<SparkleIcon className="h-5 w-5" />} title={paused ? "Resume my audit" : "See my summary"} detail={paused ? `${paused.name} is next` : "A direction, not a diagnosis"} />
                    <RowLink to={grid ? go("grid") : go("central")} icon={<CalendarIcon className="h-5 w-5" />} title="Open my goal grid" detail={grid ? `${grid.goalTitle} · ${drafts.length} draft actions` : "Choose a central goal"} />
                    <RowLink to="/growth" icon={<ReadIcon className="h-5 w-5" />} title="Your next review" detail={`Opens in ${s.reviewOpensInDays} days`} trailing={<Badge>Proposed</Badge>} />
                  </ul>
                </Panel>
                <Note title="Drafts stay drafts">Nothing here reaches Planner, Habits or your squad until you accept it.</Note>
              </>
            }
          />
        </>
      );
      break;

    case "areas":
      body = (
        <>
          <SubHeader backHref="/growth" backLabel="Back to Growth Studio" kicker="Life Audit · Your areas" title="How is life feeling?" subtitle={`${reflected.length} of ${s.areas.length} reflected on. There is no overall score.`} />
          <Split
            left={
              <>
                <section className="rounded-[24px] bg-surface p-5 shadow-raised">
                  <div className="flex items-baseline justify-between">
                    <p className="font-heading text-body font-bold text-text">Reflected on</p>
                    <p className="font-heading text-meta font-bold text-accent-strong">
                      {reflected.length} / {s.areas.length}
                    </p>
                  </div>
                  <div className="mt-3 h-2.5 rounded-full bg-accent-tint shadow-inset">
                    <span className="block h-full rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${(reflected.length / Math.max(1, s.areas.length)) * 100}%` }} />
                  </div>
                </section>
                {reflected.length ? (
                  <Panel title="Reflected on">
                    <ul className="divide-y divide-outline">
                      {reflected.map((area) => (
                        <RowLink key={area.id} to={go("rate", `area=${area.id}`)} icon={<AreaIcon icon={area.icon} />} bare title={area.name} detail={`${area.rating} / 5 · ${ratingLabel(area.rating)}`} trailing={<Badge>Edit</Badge>} />
                      ))}
                    </ul>
                  </Panel>
                ) : null}
              </>
            }
            right={
              <>
                {notYet.length ? (
                  <Panel title="Not yet">
                    <ul className="divide-y divide-outline">
                      {notYet.map((area) => (
                        <RowLink key={area.id} to={go("rate", `area=${area.id}`)} icon={<AreaIcon icon={area.icon} />} bare title={area.name} detail="Not reflected on" />
                      ))}
                    </ul>
                  </Panel>
                ) : null}
                <Primary to={notYet[0] ? go("rate", `area=${notYet[0].id}`) : go("summary")}>{notYet[0] ? `Continue with ${shortAreaName(notYet[0])}` : "See my summary"}</Primary>
                <Secondary to={go("question", "q=1")}>{`Write it out · ${answered} of ${s.questions.length} questions`}</Secondary>
                <Secondary to={go("editAreas")}>Edit my areas</Secondary>
              </>
            }
          />
        </>
      );
      break;

    case "rate": {
      const area = s.areas.find((item) => item.id === params.get("area")) ?? notYet[0] ?? s.areas[0];
      body = area ? <RateArea key={key} area={area} art={art.full} busy={busy} error={error} onSave={(rating, note) =>
        void run(async () => {
          const next = await rateArea(area.id, rating, note);
          setState(next);
          const upcoming = next.areas.find((item) => item.rating === null && item.id !== area.id);
          router.push(upcoming ? go("rate", `area=${upcoming.id}`) : go("summary"));
        })
      } /> : null;
      break;
    }

    case "question": {
      const index = Math.min(s.questions.length, Math.max(1, Number(params.get("q")) || 1)) - 1;
      const question = s.questions[index];
      body = (
        <QuestionView
          key={key}
          state={s}
          index={index}
          face={art.face}
          busy={busy}
          onSave={(answer, skip) =>
            void run(async () => {
              if (!skip) setState(await answerQuestion(question.id, answer));
              router.push(index + 1 < s.questions.length ? go("question", `q=${index + 2}`) : go("suggested"));
            })
          }
        />
      );
      break;
    }

    case "editAreas":
      body = (
        <EditAreas
          key={key}
          areas={s.areas}
          error={error}
          onDone={(areas) =>
            void run(async () => {
              setState(await saveAuditAreas(areas));
              showToast("Areas saved.");
              router.push(go("areas"));
            })
          }
        />
      );
      break;

    case "summary": {
      const sorted = [...reflected].sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
      const lowest = sorted[0];
      const highest = sorted[sorted.length - 1];
      body = (
        <SummaryView
          key={key}
          reflected={reflected}
          lowest={lowest}
          highest={highest}
          face={art.face}
          onChoose={(focus) => router.push(go("central", focus ? `focus=${encodeURIComponent(focus)}` : ""))}
        />
      );
      break;
    }

    case "central":
      body = (
        <CentralGoal
          key={key}
          goals={planner.data?.goals ?? []}
          currentGoalId={grid?.goalId ?? params.get("goal")}
          currentWhy={grid?.why ?? ""}
          focus={params.get("focus")}
          busy={busy}
          error={error}
          onBuild={(input) =>
            void run(async () => {
              const before = grid?.goalId;
              const next = await setCentralGoal(input);
              setState(next);
              router.push(next.grid && next.grid.areas.length && next.grid.goalId === before ? go("grid") : go("suggested"));
            })
          }
        />
      );
      break;

    case "suggested":
      body = (
        <>
          <header>
            <p className="font-heading text-meta font-bold tracking-widest text-text-muted uppercase">Growth Studio · From your audit</p>
            <h1 className="mt-1 font-display text-display font-extrabold text-text">Here’s a starting grid.</h1>
          </header>
          <Split
            left={
              <>
                <AriSays face={art.face}>
                  I drafted this from your {answered ? `${answered} answers` : "audit"}. Change anything, or start blank.
                </AriSays>
                <div className="grid grid-cols-3 gap-2">
                  {[...s.suggestedAreas.slice(0, 4), null, ...s.suggestedAreas.slice(4, 8)].map((area, index) =>
                    area ? (
                      <div key={area.name} className="flex min-h-[96px] flex-col justify-between rounded-[18px] border-2 border-dashed border-accent/50 bg-surface p-2.5">
                        <span className="flex items-center justify-between font-heading text-meta text-text-muted">
                          {index < 4 ? index + 1 : index}
                          <Badge>Draft</Badge>
                        </span>
                        <span className="font-heading text-body font-bold text-text">{area.name}</span>
                        <span className="font-heading text-meta text-text-muted">0 actions</span>
                      </div>
                    ) : (
                      <div key="goal" className="flex flex-col justify-center rounded-[18px] bg-[linear-gradient(160deg,#8a63e0,#4c319b)] p-2.5 text-white shadow-pressable">
                        <span className="font-heading text-[11px] tracking-wide text-white/75 uppercase">Main goal</span>
                        <span className="line-clamp-3 font-heading text-label font-bold">{grid?.goalTitle ?? "Choose a goal"}</span>
                      </div>
                    ),
                  )}
                </div>
              </>
            }
            right={
              <>
                {s.suggestedAreas.some((area) => area.quote) ? (
                  <section className="rounded-[22px] bg-[#f6efe4] p-4">
                    <p className="mb-2 font-heading text-meta tracking-wide text-accent-strong uppercase">Why these · from your answers</p>
                    <ul className="flex flex-col gap-2">
                      {s.suggestedAreas
                        .filter((area) => area.quote)
                        .map((area) => (
                          <li key={area.name} className="flex items-center gap-3">
                            <span className="rounded-full bg-surface px-3 py-1 font-heading text-meta text-accent-strong shadow-raised">{area.name}</span>
                            <span className="font-heading text-label text-text">“{area.quote}”</span>
                          </li>
                        ))}
                    </ul>
                  </section>
                ) : null}
                <ErrorLine message={error} />
                <Primary disabled={busy || !grid} onClick={() => void run(async () => {
                  setState(await applySuggestedGrid(false));
                  router.push(go("grid"));
                })}>
                  Use this grid
                </Primary>
                {!grid ? <Secondary to={go("central")}>Choose a central goal first</Secondary> : null}
                <div className="flex gap-3">
                  <Secondary to={go("grid")}>Edit areas</Secondary>
                  <Secondary onClick={() => void run(async () => {
                    setState(await applySuggestedGrid(true));
                    router.push(go("grid"));
                  })}>
                    Start blank
                  </Secondary>
                </div>
                <p className="text-center font-heading text-meta text-text-muted">Nothing is saved to your plan until you accept it.</p>
              </>
            }
          />
        </>
      );
      break;

    case "grid": {
      if (!grid) {
        body = <NoGrid />;
        break;
      }
      const mode = params.get("mode") === "grid" ? "grid" : "list";
      const icons = [<ReadIcon key="0" className="h-5 w-5" />, <PlayIcon key="1" className="h-5 w-5" />, <CalendarIcon key="2" className="h-5 w-5" />, <MoveIcon key="3" className="h-5 w-5" />, <SparkleIcon key="4" className="h-5 w-5" />];
      body = (
        <>
          <SubHeader backHref="/growth" backLabel="Back to Growth Studio" kicker="Harada · All areas" title="Many small ways forward." subtitle={`${grid.goalTitle} · 8 areas, up to 8 actions each`} />
          <Split
            left={
              <>
                <div className="flex gap-2">
                  <Link href={go("grid")} scroll={false}>
                    <Pill selected={mode === "list"}>List</Pill>
                  </Link>
                  <Link href={go("grid", "mode=grid")} scroll={false}>
                    <Pill selected={mode === "grid"}>Grid</Pill>
                  </Link>
                </div>
                {mode === "grid" ? (
                  <MiniGrid state={s} />
                ) : (
                  <>
                    <p className="font-heading text-meta text-text-muted">The list is the easy-to-read version of the grid.</p>
                    <Panel>
                      <ul className="divide-y divide-outline">
                        {grid.areas.map((area, index) => {
                          const actions = grid.actions.filter((action) => action.areaId === area.id);
                          return (
                            <RowLink
                              key={area.id}
                              to={go("area", `area=${area.id}`)}
                              icon={icons[index % icons.length]}
                              title={area.name}
                              detail={actions.length ? actions.map((action) => action.title).slice(0, 2).join(" · ") : index < 4 ? "Empty · that’s okay" : "Empty"}
                              trailing={<span className={cn("grid h-7 min-w-7 place-items-center rounded-full px-2 font-heading text-meta font-bold", actions.length ? "bg-accent-tint text-accent-strong" : "bg-[#fbeedd] text-[#9a5b12]")}>{actions.length}</span>}
                            />
                          );
                        })}
                      </ul>
                    </Panel>
                  </>
                )}
              </>
            }
            right={
              <>
                <AriSays face={art.face}>You don’t need all 8. Two or three areas with one small step each is a great start.</AriSays>
                <div className="flex gap-3">
                  {[
                    [drafts.length, "draft actions"],
                    [grid.areas.filter((area) => grid.actions.some((action) => action.areaId === area.id)).length, "areas started"],
                    [accepted.length, "accepted"],
                  ].map(([value, label]) => (
                    <div key={label} className="flex flex-1 flex-col items-center rounded-[22px] bg-surface py-5 shadow-raised">
                      <span className="font-display text-title font-extrabold text-text">{value}</span>
                      <span className="font-heading text-meta text-text-muted">{label}</span>
                    </div>
                  ))}
                </div>
                <Primary to={drafts.length ? go("rhythms") : undefined} onClick={drafts.length ? undefined : () => showToast("Add a small action to an area first.")}>
                  Review &amp; accept actions
                </Primary>
                <Secondary to={go("area", `area=${grid.areas[0]?.id ?? ""}`)}>Rename areas</Secondary>
                <Secondary to={go("central")}>Change central goal</Secondary>
              </>
            }
          />
        </>
      );
      break;
    }

    case "area": {
      const area = grid?.areas.find((item) => item.id === params.get("area"));
      if (!grid || !area) {
        body = <NoGrid />;
        break;
      }
      body = (
        <AreaView
          key={key}
          state={s}
          areaId={area.id}
          areaName={area.name}
          error={error}
          onRename={(name) =>
            void run(async () => {
              setState(await renameGridArea(area.id, name));
              showToast("Area renamed.");
            })
          }
        />
      );
      break;
    }

    case "action": {
      const existing = grid?.actions.find((item) => item.id === params.get("action"));
      const areaId = existing?.areaId ?? params.get("area") ?? "";
      const area = grid?.areas.find((item) => item.id === areaId);
      if (!grid || !area) {
        body = <NoGrid />;
        break;
      }
      body = (
        <ActionEditor
          key={key}
          goalTitle={grid.goalTitle}
          areaName={area.name}
          action={existing ?? null}
          busy={busy}
          error={error}
          onSave={(input, then) =>
            void run(async () => {
              const result = await saveGridAction({ ...input, id: existing?.id ?? null, areaId });
              setState(result.state);
              if (then === "accept") router.push(go(input.addAs === "habit" ? "acceptHabit" : "accept", `action=${result.actionId}`));
              else {
                showToast("Saved as a draft. It stays private.");
                router.push(go("area", `area=${areaId}`));
              }
            })
          }
        />
      );
      break;
    }

    case "rhythms": {
      if (!grid) {
        body = <NoGrid />;
        break;
      }
      const groups = grid.areas.map((area) => ({ area, actions: drafts.filter((action) => action.areaId === area.id) })).filter((group) => group.actions.length);
      const counts = RHYTHMS.map((rhythm) => `${drafts.filter((action) => action.rhythm === rhythm.value).length} ${rhythm.label.toLowerCase()}`).join(" · ");
      body = (
        <>
          <header>
            <p className="font-heading text-meta font-bold tracking-widest text-text-muted uppercase">Growth Studio · Rhythms</p>
            <h1 className="mt-1 font-display text-display font-extrabold text-text">How often should each happen?</h1>
          </header>
          <Split
            left={
              <>
                <Note>We suggested a rhythm for each action. Tap another to change it. Nothing is scheduled until you accept.</Note>
                {groups.length === 0 ? <Note tone="success" title="All accepted">Every action is already in your plan.</Note> : null}
                {groups.slice(0, Math.ceil(groups.length / 2)).map((group) => (
                  <RhythmGroup key={group.area.id} name={group.area.name} actions={group.actions} onChange={(id, rhythm) => void run(async () => setState(await setActionRhythm(id, rhythm)))} />
                ))}
              </>
            }
            right={
              <>
                {groups.slice(Math.ceil(groups.length / 2)).map((group) => (
                  <RhythmGroup key={group.area.id} name={group.area.name} actions={group.actions} onChange={(id, rhythm) => void run(async () => setState(await setActionRhythm(id, rhythm)))} />
                ))}
                {drafts.length ? <p className="rounded-[18px] bg-surface p-4 font-heading text-label text-text shadow-raised">{`${drafts.length} actions · ${counts}`}</p> : null}
                <ErrorLine message={error} />
                <Primary
                  disabled={busy || drafts.length === 0}
                  onClick={() =>
                    void run(async () => {
                      setState(await acceptAllRhythms());
                      showToast(`${drafts.length} actions are in your plan. Ari earns XP when you do them.`);
                      router.push(go("grid"));
                    })
                  }
                >
                  {`Accept ${drafts.length} ${drafts.length === 1 ? "rhythm" : "rhythms"}`}
                </Primary>
                <Link href={go("grid")} className="py-2 text-center font-heading text-label font-bold text-text-muted">
                  Review later
                </Link>
              </>
            }
          />
        </>
      );
      break;
    }

    case "accept":
    case "acceptHabit": {
      const action = grid?.actions.find((item) => item.id === params.get("action"));
      const area = grid?.areas.find((item) => item.id === action?.areaId);
      if (!grid || !action || !area) {
        body = <NoGrid />;
        break;
      }
      if (action.status === "accepted") {
        body = (
          <>
            <SubHeader backHref={go("area", `area=${area.id}`)} backLabel="Back to area" kicker="Action" title="Already in your plan." subtitle={`${action.title} · ${destination(action)}`} />
            <div className="mt-5 max-w-md">
              <Primary to={action.addAs === "habit" ? "/habits" : "/planner"}>Open {action.addAs === "habit" ? "Habits" : "Planner"}</Primary>
            </div>
          </>
        );
        break;
      }
      body =
        view === "accept" ? (
          <>
            <SubHeader backHref={go("action", `action=${action.id}`)} backLabel="Back to action" kicker="Action · Accept" title="Ready to make room for this?" subtitle="One clear choice. No duplicates." />
            <Split
              left={
                <AriTile art={art.full} label={action.title} title={`Task · ${action.minutes} min · ${action.rhythm === "once" ? "Once" : action.rhythm[0].toUpperCase() + action.rhythm.slice(1)}`} body={`Goal: ${grid.goalTitle} · Area: ${area.name}`}>
                  <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">Private</span>
                </AriTile>
              }
              right={
                <>
                  <Panel title="Where it goes">
                    <ul className="divide-y divide-outline">
                      <li className="flex items-center gap-3 py-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">
                          <CalendarIcon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block font-heading text-body font-bold text-text">Planner</span>
                          <span className="block font-heading text-meta text-text-muted">{action.rhythm === "daily" || action.rhythm === "once" ? "Shows up in Today" : "Shows up from tomorrow"}</span>
                        </span>
                      </li>
                      <li className="flex items-center gap-3 py-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">
                          <SparkleIcon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block font-heading text-body font-bold text-text">Goal Details</span>
                          <span className="block font-heading text-meta text-text-muted">Linked to the same goal, not copied</span>
                        </span>
                      </li>
                    </ul>
                  </Panel>
                  <Note tone="success" title="Ari earns XP when you do it">Accepting isn’t a promise. Skipping a day never takes growth away.</Note>
                  <ErrorLine message={error} />
                  <Primary disabled={busy} onClick={() => void run(async () => {
                    setState(await acceptGridAction(action.id, "task"));
                    showToast(`“${action.title}” is in your Planner.`);
                    router.push(go("area", `area=${area.id}`));
                  })}>
                    Accept into Planner
                  </Primary>
                  <Secondary to={go("area", `area=${area.id}`)}>Keep as draft</Secondary>
                </>
              }
            />
          </>
        ) : (
          <AcceptHabit
            key={key}
            action={action}
            areaName={area.name}
            busy={busy}
            error={error}
            onAsTask={() => router.push(go("accept", `action=${action.id}`))}
            onAccept={(options) =>
              void run(async () => {
                setState(await acceptGridAction(action.id, "habit", options));
                showToast(`“${action.title}” is in your Habit Tracker.`);
                router.push(go("area", `area=${area.id}`));
              })
            }
            onKeepDraft={() => router.push(go("area", `area=${area.id}`))}
          />
        );
      break;
    }

    default:
      body = (
        <>
          <header>
            <p className="font-heading text-meta font-bold tracking-widest text-text-muted uppercase">Growth Studio · Optional</p>
            <h1 className="mt-1 font-display text-display font-extrabold text-text">Find your direction.</h1>
          </header>
          <Split
            left={
              <AriTile art={art.full} label="Growth Studio" title="A little clarity. A little space." body="Reflect, set one central goal, then let it turn into small weekly actions. Skip anything, anytime.">
                <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">Private by default</span>
              </AriTile>
            }
            right={
              <>
                <ol className="flex flex-col gap-3">
                  {[
                    { title: "Life Audit", detail: `${reflected.length} of ${s.areas.length} areas · private`, cta: reflected.length ? "Continue" : "Start", to: go("areas"), active: true },
                    { title: "Harada Grid", detail: grid ? `Central goal set · ${namedAreas} of 8 areas named` : "Choose one central goal", cta: grid ? "Open" : "Start", to: grid ? go("grid") : go("central"), active: true },
                    { title: "Quadrant Scheduler", detail: drafts.length ? `${drafts.length} draft actions waiting for you` : "Nothing waiting", cta: "Review", to: go("rhythms"), active: drafts.length > 0 },
                    { title: "15-Day Review", detail: `Opens in ${s.reviewOpensInDays} days · 3 short questions`, cta: "", to: "", active: false },
                  ].map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                      <span
                        className={cn(
                          "grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-heading font-extrabold",
                          index === 0 ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : "bg-[radial-gradient(circle_at_35%_30%,#fff,#e2d8f8)] text-accent-strong shadow-raised",
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className={cn("flex-1 rounded-[22px] p-4", step.active ? "bg-surface shadow-raised" : "bg-surface/60")}>
                        <p className={cn("font-heading text-body font-bold", step.active ? "text-text" : "text-text-muted")}>{step.title}</p>
                        <p className="font-heading text-meta text-text-muted">{step.detail}</p>
                        {step.cta && step.active ? (
                          <Link href={step.to} className="mt-2 inline-block font-heading text-label font-bold text-accent-strong">
                            {step.cta} →
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
                <Note>Accepted actions land in your Planner and Habit Tracker. Drafts never do.</Note>
                <Primary to={paused ? go("rate", `area=${paused.id}`) : grid ? go("grid") : go("central")}>{paused ? "Continue Life Audit" : grid ? "Open my grid" : "Choose a central goal"}</Primary>
              </>
            }
          />
        </>
      );
  }

  return <Main>{body}</Main>;
}

function Main({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pt-7 pb-36 sm:px-8 md:pt-10 md:pb-16">
      {children}
      <p role="status" className="mt-6 font-heading text-meta text-text-muted">
        Preview: reflections, grids and drafts here are examples, not saved account data yet.
      </p>
    </main>
  );
}

function RowLink({ to, icon, title, detail, trailing, bare }: { to: string; icon: ReactNode; title: string; detail: string; trailing?: ReactNode; bare?: boolean }) {
  return (
    <li>
      <Link href={to} className="flex items-center gap-3 py-3">
        {bare ? icon : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-tint text-accent-strong">{icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-body font-bold text-text">{title}</span>
          <span className="block truncate font-heading text-meta text-text-muted">{detail}</span>
        </span>
        {trailing}
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-muted" />
      </Link>
    </li>
  );
}

function NoGrid() {
  return (
    <>
      <SubHeader backHref="/growth" backLabel="Back to Growth Studio" kicker="Harada" title="No grid yet." subtitle="Choose one central goal and the grid builds around it." />
      <div className="mt-5 max-w-md">
        <Primary to={go("central")}>Choose a central goal</Primary>
      </div>
    </>
  );
}

function RateArea({ area, art, busy, error, onSave }: { area: AuditArea; art: Parameters<typeof AriTile>[0]["art"]; busy: boolean; error: string | null; onSave: (rating: number | null, note: string) => void }) {
  const [rating, setRating] = useState<number | null>(area.rating);
  const [note, setNote] = useState(area.note);
  const word = shortAreaName(area).toLowerCase();
  return (
    <>
      <SubHeader backHref={go("areas")} backLabel="Back to areas" kicker={`Life Audit · ${area.name}`} title={`Make a little room for ${word}.`} subtitle="Only you can see this." />
      <Split
        left={<AriTile art={art} label={area.name} title={`How supported does this feel today?`} body="Pick what feels true right now. You can change it later." />}
        right={
          <>
            <section className="rounded-[26px] bg-surface p-5 shadow-raised">
              <p className="font-display text-heading font-extrabold text-text">Today, {word} feels…</p>
              <div role="radiogroup" aria-label={`${area.name} rating`} className="mt-4 grid grid-cols-5 gap-2">
                {RATINGS.map((item) => (
                  <button key={item.value} type="button" role="radio" aria-checked={rating === item.value} onClick={() => setRating(item.value)} className="flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        "grid h-12 w-12 place-items-center rounded-full font-display text-heading font-extrabold",
                        rating === item.value ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : "bg-[radial-gradient(circle_at_35%_30%,#fff,#e2d8f8)] text-accent-strong shadow-raised",
                      )}
                    >
                      {item.value}
                    </span>
                    <span className={cn("text-center font-heading text-meta", rating === item.value ? "font-bold text-accent-strong" : "text-text-muted")}>{item.label}</span>
                  </button>
                ))}
              </div>
            </section>
            <label className="block">
              <span className="mb-2 block font-heading text-body font-bold text-text">A note to yourself · optional</span>
              <span className="flex items-center gap-3 rounded-[22px] bg-surface px-5 py-3.5 shadow-raised focus-within:outline focus-within:outline-2 focus-within:outline-accent">
                <input value={note} maxLength={280} onChange={(event) => setNote(event.target.value)} className="min-w-0 flex-1 bg-transparent font-heading text-body text-text outline-none" placeholder="What’s true right now?" />
                <span className="font-heading text-meta font-bold text-accent-strong">Private</span>
              </span>
            </label>
            <ErrorLine message={error} />
            <Primary disabled={busy || rating === null} onClick={() => onSave(rating, note)}>
              Save &amp; next area
            </Primary>
            <Secondary onClick={() => onSave(null, note)}>Skip this one</Secondary>
          </>
        }
      />
    </>
  );
}

function QuestionView({ state, index, face, busy, onSave }: { state: GrowthStudioState; index: number; face: Parameters<typeof AriSays>[0]["face"]; busy: boolean; onSave: (answer: string, skip: boolean) => void }) {
  const question = state.questions[index];
  const [answer, setAnswer] = useState(question.answer);
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  return (
    <>
      <header>
        <p className="font-heading text-meta font-bold tracking-widest text-text-muted uppercase">Growth Studio · Audit</p>
        <h1 className="mt-1 font-display text-display font-extrabold text-text">Where are you now?</h1>
      </header>
      <Split
        left={
          <>
            <div className="flex items-center gap-3">
              <span className="flex flex-1 gap-1" aria-hidden>
                {state.questions.map((item, position) => (
                  <span key={item.id} className={cn("h-1.5 flex-1 rounded-full", position <= index ? "bg-accent" : "bg-accent-tint")} />
                ))}
              </span>
              <span className="font-heading text-meta text-text-muted">
                {index + 1} of {state.questions.length}
              </span>
            </div>
            <nav aria-label="Questions" className="flex flex-wrap gap-2">
              {state.questions.map((item, position) => (
                <Link
                  key={item.id}
                  href={go("question", `q=${position + 1}`)}
                  scroll={false}
                  className={cn(
                    "rounded-full px-3 py-1.5 font-heading text-meta",
                    position === index ? "bg-[image:var(--gradient-primary)] font-bold text-white" : item.answer ? "bg-surface text-accent-strong shadow-raised" : "bg-accent-tint/60 text-text-muted",
                  )}
                >
                  {item.answer && position !== index ? "✓ " : ""}
                  {item.topic}
                </Link>
              ))}
            </nav>
            <section className="rounded-[26px] bg-[#f6efe4] p-5 shadow-raised">
              <p className="font-heading text-meta tracking-wide text-accent-strong uppercase">
                Question {index + 1} · {question.topic}
              </p>
              <p className="mt-2 font-display text-heading font-extrabold text-text">{question.prompt}</p>
              <p className="mt-2 font-heading text-label text-text-muted">{question.hint}</p>
            </section>
          </>
        }
        right={
          <>
            <label className="block rounded-[24px] bg-surface p-4 shadow-raised outline outline-2 outline-accent">
              <span className="sr-only">Your answer</span>
              <textarea value={answer} maxLength={2000} rows={6} onChange={(event) => setAnswer(event.target.value)} className="w-full resize-none bg-transparent font-heading text-body text-text outline-none" placeholder="Write it how you would say it." />
              <span className="flex justify-between font-heading text-meta text-text-muted">
                <span>Private draft</span>
                <span>{words} words</span>
              </span>
            </label>
            <AriSays face={face}>Write it how you would say it. Only you will ever read this.</AriSays>
            <div className="flex gap-3">
              <Secondary onClick={() => onSave(answer, true)}>Skip for now</Secondary>
              <Primary disabled={busy} onClick={() => onSave(answer, false)}>
                Save &amp; next
              </Primary>
            </div>
            <p className="text-center font-heading text-meta text-text-muted">All {state.questions.length} answers stay private. You can come back and edit any of them.</p>
          </>
        }
      />
    </>
  );
}

function EditAreas({ areas, error, onDone }: { areas: AuditArea[]; error: string | null; onDone: (areas: { id: string | null; name: string }[]) => void }) {
  const [list, setList] = useState(areas.map((area) => ({ id: area.id as string | null, name: area.name, icon: area.icon })));
  const [draft, setDraft] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    setList(next);
  };
  return (
    <>
      <SubHeader backHref={go("areas")} backLabel="Back to areas" kicker="Life Audit · Edit areas" title="Life doesn’t fit one template." subtitle="Rename, add, reorder or remove areas." />
      <Split
        left={
          <Panel title="Your areas · use ↑↓ to reorder">
            <ul className="divide-y divide-outline">
              {list.map((area, index) => (
                <li key={`${area.id ?? "new"}-${index}`} className="flex items-center gap-3 py-2.5">
                  <AreaIcon icon={area.icon} />
                  <input
                    value={area.name}
                    maxLength={40}
                    aria-label={`Rename ${area.name}`}
                    onChange={(event) => setList(list.map((item, position) => (position === index ? { ...item, name: event.target.value } : item)))}
                    className="min-w-0 flex-1 rounded-full bg-transparent px-2 py-1 font-heading text-body font-bold text-text focus:bg-accent-tint/40"
                  />
                  <button type="button" aria-label={`Move ${area.name} up`} onClick={() => move(index, -1)} className="px-1 font-heading text-accent-strong">
                    ↑
                  </button>
                  <button type="button" aria-label={`Move ${area.name} down`} onClick={() => move(index, 1)} className="px-1 font-heading text-accent-strong">
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label={confirmRemove === index ? `Confirm removing ${area.name}` : `Remove ${area.name}`}
                    onClick={() => {
                      if (confirmRemove === index) {
                        setList(list.filter((_, position) => position !== index));
                        setConfirmRemove(null);
                      } else setConfirmRemove(index);
                    }}
                    className={cn("rounded-full px-2 py-0.5 font-heading text-meta", confirmRemove === index ? "bg-[#fdeedd] font-bold text-[#9a5b12]" : "text-text-muted")}
                  >
                    {confirmRemove === index ? "Remove?" : "✕"}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        }
        right={
          <>
            <label className="block">
              <span className="mb-2 block font-heading text-body font-bold text-text">Add an area</span>
              <span className="flex items-center gap-3 rounded-[22px] bg-surface px-5 py-3.5 shadow-raised">
                <input value={draft} maxLength={40} onChange={(event) => setDraft(event.target.value)} placeholder="e.g. Faith, Creativity, Side project" className="min-w-0 flex-1 bg-transparent font-heading text-body text-text outline-none placeholder:text-text-muted" />
                <button
                  type="button"
                  disabled={draft.trim().length < 2 || list.length >= 12}
                  onClick={() => {
                    setList([...list, { id: null, name: draft.trim(), icon: "spark" }]);
                    setDraft("");
                  }}
                  className="font-heading text-label font-bold text-accent-strong disabled:opacity-50"
                >
                  Add
                </button>
              </span>
            </label>
            <Note tone="warm" title="Removing an area">Tap ✕, then “Remove?” to confirm. Its notes go with it, so nothing is removed on one tap.</Note>
            <ErrorLine message={error} />
            <Primary onClick={() => onDone(list.map(({ id, name }) => ({ id, name })))}>Done</Primary>
          </>
        }
      />
    </>
  );
}

function SummaryView({ reflected, lowest, highest, face, onChoose }: { reflected: AuditArea[]; lowest?: AuditArea; highest?: AuditArea; face: Parameters<typeof AriSays>[0]["face"]; onChoose: (focus: string | null) => void }) {
  const [focus, setFocus] = useState<string>(highest ? shortAreaName(highest) : "Something else");
  const options = [...new Set([highest, lowest, ...reflected].filter((area): area is AuditArea => Boolean(area)).map(shortAreaName))].slice(0, 3);
  return (
    <>
      <SubHeader backHref={go("areas")} backLabel="Back to areas" kicker="Life Audit · Summary" title="A little clearer now." subtitle="A direction, not a diagnosis." />
      <Split
        left={
          <>
            {lowest && highest && lowest.id !== highest.id ? (
              <AriSays face={face}>{`${shortAreaName(lowest)} could use more room. ${shortAreaName(highest)} already feels good, so let’s keep what’s helping.`}</AriSays>
            ) : (
              <AriSays face={face}>Reflect on a few areas and I’ll notice what stands out.</AriSays>
            )}
            <Panel>
              <ul className="divide-y divide-outline">
                {reflected.map((area) => (
                  <li key={area.id} className="flex items-center gap-3 py-3">
                    <AreaIcon icon={area.icon} />
                    <span>
                      <span className="block font-heading text-body font-bold text-text">
                        {area.name} {area.rating !== null && area.rating <= 2 ? "could use more room" : area.rating !== null && area.rating >= 4 ? "feels supported" : "is steady"}
                      </span>
                      <span className="block font-heading text-meta text-text-muted">
                        You chose {area.rating} / 5.{area.note ? ` “${area.note}”` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        }
        right={
          <>
            <Choice legend="What would you like to work on?" value={focus} onChange={setFocus} options={[...options, "Something else"].map((value) => ({ value, label: value }))} />
            <Primary onClick={() => onChoose(focus === "Something else" ? null : focus)}>Choose a central goal</Primary>
            <Secondary to="/growth">Save &amp; come back later</Secondary>
          </>
        }
      />
    </>
  );
}

function CentralGoal({
  goals,
  currentGoalId,
  currentWhy,
  focus,
  busy,
  error,
  onBuild,
}: {
  goals: { id: string; title: string; detail: string; isPaused: boolean }[];
  currentGoalId: string | null;
  currentWhy: string;
  focus: string | null;
  busy: boolean;
  error: string | null;
  onBuild: (input: { goalId: string | null; newTitle?: string; why: string }) => void;
}) {
  const [mode, setMode] = useState<"existing" | "new">(goals.length ? "existing" : "new");
  const [goalId, setGoalId] = useState(currentGoalId ?? goals[0]?.id ?? "");
  const [title, setTitle] = useState(focus ? `Make more room for ${focus.toLowerCase()}` : "");
  const [why, setWhy] = useState(currentWhy);
  return (
    <>
      <SubHeader backHref="/growth" backLabel="Back to Growth Studio" kicker="Harada · Central goal" title="One goal worth growing into." subtitle="Use a goal you already have, or start a new one." />
      <Split
        left={
          <>
            <div className="flex gap-2">
              <button type="button" aria-pressed={mode === "existing"} onClick={() => setMode("existing")} disabled={!goals.length}>
                <Pill selected={mode === "existing"}>Use an existing goal</Pill>
              </button>
              <button type="button" aria-pressed={mode === "new"} onClick={() => setMode("new")}>
                <Pill selected={mode === "new"}>Draft a new goal</Pill>
              </button>
            </div>
            {mode === "existing" ? (
              <Panel title="Your goals">
                <ul role="radiogroup" aria-label="Your goals" className="divide-y divide-outline">
                  {goals.map((goal) => (
                    <li key={goal.id}>
                      <button type="button" role="radio" aria-checked={goalId === goal.id} onClick={() => setGoalId(goal.id)} className="flex w-full items-center gap-3 py-3 text-left">
                        <CheckOrb id={`goal-${goal.id}`} size="sm" label={goal.title} checked={goalId === goal.id} disabled onChange={() => undefined} />
                        <span>
                          <span className="block font-heading text-body font-bold text-text">{goal.title}</span>
                          <span className="block font-heading text-meta text-text-muted">{goal.isPaused ? `${goal.detail} · paused` : goal.detail}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : (
              <label className="block">
                <span className="mb-2 block font-heading text-body font-bold text-text">Your goal</span>
                <input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} placeholder="Become a confident developer" className="w-full rounded-[22px] bg-surface px-5 py-4 font-heading text-body text-text shadow-raised outline outline-2 outline-accent placeholder:text-text-muted" />
              </label>
            )}
          </>
        }
        right={
          <>
            <label className="block">
              <span className="mb-2 block font-heading text-body font-bold text-text">Why it matters · optional</span>
              <textarea value={why} maxLength={280} rows={3} onChange={(event) => setWhy(event.target.value)} className="w-full resize-none rounded-[22px] bg-surface px-5 py-4 font-heading text-body text-text shadow-raised" placeholder="In a sentence, for you." />
            </label>
            <Note>{mode === "existing" ? "This is the same goal you see in Goal Details. No copy is made." : "This creates a real goal you’ll also see in Plan · Goals."}</Note>
            <ErrorLine message={error} />
            <Primary
              disabled={busy || (mode === "existing" ? !goalId : title.trim().length < 2)}
              onClick={() => onBuild(mode === "existing" ? { goalId, why } : { goalId: null, newTitle: title, why })}
            >
              Build my grid
            </Primary>
          </>
        }
      />
    </>
  );
}

function AreaView({ state, areaId, areaName, error, onRename }: { state: GrowthStudioState; areaId: string; areaName: string; error: string | null; onRename: (name: string) => void }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(areaName);
  const grid = state.grid;
  if (!grid) return null;
  const actions = grid.actions.filter((action) => action.areaId === areaId);
  return (
    <>
      <SubHeader backHref={go("grid")} backLabel="Back to grid" kicker="Harada · Supporting area" title="Support the person doing the work." subtitle={`${areaName} → ${grid.goalTitle}`} />
      <Split
        left={<MiniGrid state={state} selectedId={areaId} compact />}
        right={
          <>
            <label className="block">
              <span className="mb-2 block font-heading text-body font-bold text-text">Area name</span>
              <span className="flex items-center gap-3 rounded-[22px] bg-surface px-5 py-3.5 shadow-raised">
                {renaming ? (
                  <input value={name} maxLength={30} onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1 rounded-full bg-accent-tint/40 px-3 py-1 font-heading text-body text-text" />
                ) : (
                  <span className="flex-1 font-heading text-body text-text">{areaName}</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (renaming && name.trim() !== areaName) onRename(name);
                    setRenaming(!renaming);
                  }}
                  className="font-heading text-meta font-bold text-accent-strong"
                >
                  {renaming ? "Save" : "Rename"}
                </button>
              </span>
            </label>
            <ErrorLine message={error} />
            <Panel title="Small actions · up to 8">
              {actions.length === 0 ? (
                <p className="py-3 font-heading text-body text-text-muted">Empty · that’s okay. One small step is plenty.</p>
              ) : (
                <ul className="divide-y divide-outline">
                  {actions.map((action) => (
                    <li key={action.id}>
                      <Link href={go(action.status === "accepted" ? (action.addAs === "habit" ? "acceptHabit" : "accept") : "action", `action=${action.id}`)} className="flex items-center gap-3 py-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-tint text-accent-strong">{action.addAs === "habit" ? <WaterIcon className="h-5 w-5" /> : <MoveIcon className="h-5 w-5" />}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-heading text-body font-bold text-text">{action.title}</span>
                          <span className="block font-heading text-meta text-text-muted">
                            {action.status === "suggestion" ? "Suggested by Ari" : action.status === "accepted" ? `In ${destination(action)}` : `Draft · ${action.minutes} min · not scheduled`}
                          </span>
                        </span>
                        {action.status === "suggestion" ? <Badge tone="warm">Suggestion</Badge> : action.status === "accepted" ? <span className="rounded-full bg-success-tint px-3 py-1 font-heading text-meta font-bold text-success">Accepted</span> : <Badge>Draft</Badge>}
                        <ChevronRightIcon className="h-4 w-4 text-text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Primary to={actions.length < 8 ? go("action", `area=${areaId}`) : undefined} disabled={actions.length >= 8}>
              {actions.length < 8 ? "Add a small action" : "This area is full"}
            </Primary>
            <Secondary to={go("grid")}>Back to grid</Secondary>
          </>
        }
      />
    </>
  );
}

function ActionEditor({
  goalTitle,
  areaName,
  action,
  busy,
  error,
  onSave,
}: {
  goalTitle: string;
  areaName: string;
  action: GridAction | null;
  busy: boolean;
  error: string | null;
  onSave: (input: { title: string; minutes: number; addAs: "task" | "habit"; rhythm: ActionRhythm }, then: "draft" | "accept") => void;
}) {
  const [title, setTitle] = useState(action?.title ?? "");
  const preset = action && [10, 20, 30].includes(action.minutes) ? String(action.minutes) : action ? "custom" : "20";
  const [duration, setDuration] = useState<string>(preset);
  const [custom, setCustom] = useState(action && preset === "custom" ? String(action.minutes) : "");
  const [addAs, setAddAs] = useState<"task" | "habit">(action?.addAs ?? "task");
  const [rhythm, setRhythm] = useState<ActionRhythm>(action?.rhythm === "seasonal" ? "monthly" : action?.rhythm ?? "daily");
  const [localError, setLocalError] = useState<string | null>(null);

  function submit(then: "draft" | "accept") {
    const minutes = duration === "custom" ? Number(custom) : Number(duration);
    if (title.trim().length < 2) return setLocalError("Give the action a short name.");
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) return setLocalError("Custom time is whole minutes, 1 to 600.");
    setLocalError(null);
    onSave({ title, minutes, addAs, rhythm }, then);
  }

  return (
    <>
      <SubHeader backHref={go("grid")} backLabel="Back to grid" kicker="Harada · Edit action" title="Make the next step small." subtitle={`${areaName} → ${goalTitle}`} />
      <Split
        left={
          <>
            <label className="block">
              <span className="mb-2 block font-heading text-body font-bold text-text">Action</span>
              <input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} placeholder="Walk for 20 minutes" className="w-full rounded-[22px] bg-surface px-5 py-4 font-heading text-body text-text shadow-raised outline outline-2 outline-accent placeholder:text-text-muted" />
            </label>
            <Choice
              legend="Duration"
              value={duration}
              onChange={setDuration}
              options={[
                { value: "10", label: "10 min" },
                { value: "20", label: "20 min" },
                { value: "30", label: "30 min" },
                { value: "custom", label: "Custom" },
              ]}
            />
            {duration === "custom" ? (
              <label className="-mt-2 flex items-center gap-2 font-heading text-label text-text-muted">
                <input inputMode="numeric" aria-label="Minutes" value={custom} onChange={(event) => setCustom(event.target.value.replace(/\D/g, "").slice(0, 3))} className="w-20 rounded-full bg-surface px-4 py-2 text-text shadow-inset" />
                minutes
              </label>
            ) : null}
            <p className="-mt-2 font-heading text-meta text-text-muted">An estimate. You can change it later in Planner.</p>
          </>
        }
        right={
          <>
            <Choice
              legend="Add as"
              value={addAs}
              onChange={setAddAs}
              options={[
                { value: "task", label: "Task → Planner" },
                { value: "habit", label: "Habit → Tracker" },
              ]}
            />
            <p className="-mt-3 font-heading text-meta text-text-muted">One or the other, never both.</p>
            <Choice
              legend="Repeats"
              value={rhythm}
              onChange={setRhythm}
              options={[
                { value: "once", label: "Once" },
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
              ]}
            />
            <ErrorLine message={localError ?? error} />
            <Primary disabled={busy} onClick={() => submit("draft")}>
              Save draft
            </Primary>
            <Secondary onClick={() => submit("accept")}>Accept into my plan</Secondary>
          </>
        }
      />
    </>
  );
}

function RhythmGroup({ name, actions, onChange }: { name: string; actions: GridAction[]; onChange: (id: string, rhythm: ActionRhythm) => void }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-display text-heading font-extrabold text-text">{name}</h2>
        <span className="font-heading text-meta text-text-muted">
          {actions.length} {actions.length === 1 ? "action" : "actions"}
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {actions.map((action) => (
          <li key={action.id} className="rounded-[22px] bg-surface p-4 shadow-raised">
            <div className="flex items-start justify-between gap-3">
              <span>
                <span className="block font-heading text-body font-bold text-text">{action.title}</span>
                <span className="block font-heading text-meta text-text-muted">{action.minutes >= 60 ? `${Math.round(action.minutes / 60)} h` : `${action.minutes} min`}</span>
              </span>
              {action.rhythmChangedByYou ? <Badge tone="warm">Changed by you</Badge> : <Badge>Suggested</Badge>}
            </div>
            <div role="radiogroup" aria-label={`${action.title} rhythm`} className="mt-3 flex rounded-full bg-accent-tint/70 p-1 shadow-inset">
              {RHYTHMS.map((rhythm) => (
                <button
                  key={rhythm.value}
                  type="button"
                  role="radio"
                  aria-checked={action.rhythm === rhythm.value}
                  onClick={() => onChange(action.id, rhythm.value)}
                  className={cn("flex-1 rounded-full py-2 font-heading text-meta transition", action.rhythm === rhythm.value ? "bg-[image:var(--gradient-primary)] font-bold text-white shadow-pressable" : "text-text-muted")}
                >
                  {rhythm.label}
                </button>
              ))}
            </div>
            <p className="mt-2 font-heading text-meta text-success">→ {destination(action)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function AcceptHabit({
  action,
  areaName,
  busy,
  error,
  onAsTask,
  onAccept,
  onKeepDraft,
}: {
  action: GridAction;
  areaName: string;
  busy: boolean;
  error: string | null;
  onAsTask: () => void;
  onAccept: (options: { days: number[]; targetMinutes: number; reminderTime: string | null }) => void;
  onKeepDraft: () => void;
}) {
  const [often, setOften] = useState<"every" | "weekdays" | "three" | "custom">("every");
  const [custom, setCustom] = useState<number[]>([0, 2, 4]);
  const [target, setTarget] = useState(String([10, 20, 30].includes(action.minutes) ? action.minutes : 20));
  const [reminder, setReminder] = useState(true);
  const [time, setTime] = useState("17:30");
  const days = often === "every" ? ALL_DAYS : often === "weekdays" ? [0, 1, 2, 3, 4] : often === "three" ? [0, 2, 4] : custom;
  return (
    <>
      <SubHeader backHref={go("action", `action=${action.id}`)} backLabel="Back to action" kicker="Action · Accept as habit" title="A small ritual, not another list." subtitle={`${action.title} · ${areaName}`} />
      <Split
        left={
          <>
            <Choice legend="Add as" value="habit" onChange={(value) => (value === "task" ? onAsTask() : undefined)} options={[{ value: "task", label: "Task → Planner" }, { value: "habit", label: "Habit → Tracker" }]} />
            <p className="-mt-3 font-heading text-meta text-text-muted">One or the other. Never both.</p>
            <Choice
              legend="How often"
              value={often}
              onChange={setOften}
              options={[
                { value: "every", label: "Every day" },
                { value: "weekdays", label: "Weekdays" },
                { value: "three", label: "3× a week" },
                { value: "custom", label: "Custom" },
              ]}
            />
            {often === "custom" ? (
              <div role="group" aria-label="Days" className="flex flex-wrap gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, day) => (
                  <button key={label} type="button" aria-pressed={custom.includes(day)} onClick={() => setCustom(custom.includes(day) ? custom.filter((item) => item !== day) : [...custom, day].sort((a, b) => a - b))}>
                    <Pill selected={custom.includes(day)}>{label}</Pill>
                  </button>
                ))}
              </div>
            ) : null}
            <Choice legend="Target" value={target} onChange={setTarget} options={["10", "20", "30"].map((value) => ({ value, label: `${value} min` }))} />
          </>
        }
        right={
          <>
            <Panel title="Reminder">
              <div className="flex items-center justify-between gap-4 py-2">
                <span>
                  <span className="block font-heading text-body font-bold text-text">
                    Nudge me at{" "}
                    <input type="time" value={time} disabled={!reminder} onChange={(event) => setTime(event.target.value)} aria-label="Reminder time" className="bg-transparent font-bold text-text disabled:text-text-muted" />
                  </span>
                  <span className="block font-heading text-meta text-text-muted">Respects quiet hours</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={reminder}
                  aria-label="Reminder"
                  onClick={() => setReminder(!reminder)}
                  className={cn("relative h-8 w-14 shrink-0 rounded-full transition", reminder ? "bg-[image:var(--gradient-primary)] shadow-pressable" : "bg-accent-tint shadow-inset")}
                >
                  <span className={cn("absolute top-1 h-6 w-6 rounded-full bg-surface shadow-raised transition-all", reminder ? "left-7" : "left-1")} />
                </button>
              </div>
            </Panel>
            <Note tone="success" title="Becomes a Habit orb">It shows up in Habit Tracker, linked to your goal. Ari earns XP each day you do it.</Note>
            <ErrorLine message={error} />
            <Primary disabled={busy || days.length === 0} onClick={() => onAccept({ days, targetMinutes: Number(target), reminderTime: reminder ? time : null })}>
              Accept as habit
            </Primary>
            <Secondary onClick={onKeepDraft}>Keep as draft</Secondary>
          </>
        }
      />
    </>
  );
}
