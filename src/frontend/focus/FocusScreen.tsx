"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import malikFace from "../assets/faces/malik-face.png";
import zaraFace from "../assets/faces/zara-face.png";
import { STAGE_ART } from "../companion";
import { FaceAvatar, Logo } from "../components";
import { useToday } from "../hooks";
import { usePlanner } from "../hooks/usePlanner";
import { CheckIcon, ChevronRightIcon, MoveIcon, PlayIcon, SparkleIcon, WaterIcon } from "../home/icons";
import { cn } from "../lib/cn";
import { quoteFocusXp, saveFocusSession, startFocusSession } from "../api/liveRepository";
import { getFocusLobby } from "../mocks/repository";
import type { FocusLobby, Task } from "../mocks/types";
import { useNow } from "./clock";
import {
  BREAK_OPTIONS,
  LENGTH_OPTIONS,
  PAUSE_AUTO_END_MS,
  clock,
  focusReducer,
  focusedAt,
  hoursMinutes,
  initialFocusState,
  remainingAt,
  shortDuration,
  type FocusState,
  type FocusTaskRef,
  type StopReason,
} from "./session";
import { clearFocus, loadFocus, persistFocus } from "./storage";
import { AriCard, DarkPill, FocusButton, FocusFrame, FocusHeader, FocusRing, Glass, GlassLabel, StatTile, WarnCard } from "./ui";

const FACES: Record<string, typeof zaraFace> = { Zara: zaraFace, Malik: malikFace };

const REASONS: { value: StopReason; label: string }[] = [
  { value: "taskDone", label: "Task done" },
  { value: "interrupted", label: "Interrupted" },
  { value: "needBreak", label: "Need a break" },
  { value: "other", label: "Something else" },
];

function newSessionKey(): string {
  return `focus-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function taskRef(task: Task): FocusTaskRef {
  const detail = [task.goalName ? `Goal: ${task.goalName}` : task.category, task.isShared ? `${task.sharedByName ?? "Squad"} shared` : "Private"]
    .filter(Boolean)
    .join(" · ");
  return { id: task.id, title: task.title, detail, isTodayTask: true };
}

/** Sample states for design review: /focus?preview=interrupted|offline|saveError */
function previewState(kind: string | null): FocusState | null {
  const base: FocusState = {
    ...initialFocusState,
    task: { id: "task-1", title: "Review JS closures", isTodayTask: true },
    sessionKey: "preview",
    closedAt: Date.now() - 3 * 60_000,
  };
  if (kind === "interrupted") return { ...base, phase: "interrupted", focusedMs: 14 * 60_000 };
  if (kind === "offline") return { ...base, phase: "offline", focusedMs: 25 * 60_000 };
  if (kind === "saveError") return { ...base, phase: "saveError", focusedMs: 25 * 60_000 };
  return null;
}

function initFocus(preview: string | null): FocusState {
  return previewState(preview) ?? loadFocus();
}

function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

/** Figma 04 · Do the work and 04b · Focus states. */
export function FocusScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const today = useToday();
  const planner = usePlanner();
  const now = useNow();
  const [state, dispatch] = useReducer(focusReducer, params.get("preview"), initFocus);
  const [lobby, setLobby] = useState<FocusLobby | null>(null);
  const [quote, setQuote] = useState<number | null>(null);
  const [markedDone, setMarkedDone] = useState<"no" | "yes" | "notYet">("no");
  const [waterAdded, setWaterAdded] = useState(false);

  const stage = today.data?.companion.stage ?? "teen";
  const art = STAGE_ART[stage];
  const squadName = planner.data?.squadName ?? lobby?.squadName ?? "your squad";
  const isPreview = params.get("preview") !== null;

  // The task setup shows: an explicit choice, else ?task=…, else the first open task today.
  const todayTasks = today.data?.tasks ?? [];
  const requestedId = params.get("task");
  const autoTask = todayTasks.find((task) => task.id === requestedId && !task.isDone) ?? todayTasks.find((task) => !task.isDone) ?? null;
  const setupTask: FocusTaskRef | null =
    state.taskChoice.kind === "task" ? state.taskChoice.task : state.taskChoice.kind === "none" ? null : autoTask ? taskRef(autoTask) : null;

  // `now` is 0 until the shared clock's first tick; the numbers settle within half a second.
  const focused = focusedAt(state, now);
  const remaining = remainingAt(state, now);

  // ---- persistence: keep the session on this device while it matters
  useEffect(() => {
    if (isPreview) return;
    persistFocus(state, Date.now());
    if (state.runningSince === null) return;
    const id = window.setInterval(() => persistFocus(state, Date.now()), 5_000);
    const onHide = () => persistFocus(state, Date.now());
    window.addEventListener("pagehide", onHide);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("pagehide", onHide);
    };
  }, [state, isPreview]);

  // ---- saving
  const save = useCallback(
    async (then: "complete" | "break") => {
      const at = Date.now();
      const snapshot = state;
      const seconds = Math.round(focusedAt(snapshot, at) / 1000);
      dispatch({ type: "beginSave", now: at });
      if (isPreview) {
        dispatch({ type: "saveFailed", offline: snapshot.phase === "offline" });
        return;
      }
      if (!isOnline()) {
        dispatch({ type: "saveFailed", offline: true });
        return;
      }
      try {
        const result = await saveFocusSession(snapshot.sessionKey ?? newSessionKey(), {
          taskId: snapshot.task?.id ?? null,
          focusedSeconds: seconds,
          plannedMinutes: snapshot.lengthMinutes,
          mode: snapshot.mode,
          stopReason: snapshot.stopReason,
        });
        dispatch({ type: "saved", result: { focusedSeconds: result.focusedSeconds, xpAwarded: result.xpAwarded, weekFocusedMinutes: result.weekFocusedMinutes } });
        if (then === "break") dispatch({ type: "startBreak", now: Date.now() });
      } catch {
        dispatch({ type: "saveFailed", offline: !isOnline() });
      }
    },
    [state, isPreview],
  );

  // ---- timers that move the session on by themselves
  useEffect(() => {
    if (state.phase === "active" && state.runningSince !== null) {
      const left = remainingAt(state, Date.now());
      const id = window.setTimeout(() => void save("complete"), left + 50);
      return () => window.clearTimeout(id);
    }
    if (state.phase === "paused" && state.pausedAt !== null) {
      const left = state.pausedAt + PAUSE_AUTO_END_MS - Date.now();
      const id = window.setTimeout(() => void save("complete"), Math.max(0, left));
      return () => window.clearTimeout(id);
    }
    if ((state.phase === "offline" || state.phase === "saveError") && !isPreview) {
      const retry = () => void save("complete");
      window.addEventListener("online", retry);
      return () => window.removeEventListener("online", retry);
    }
    return undefined;
  }, [state, save, isPreview]);

  // ---- data that some screens need
  useEffect(() => {
    if (state.phase !== "lobby" && !(state.phase === "active" && state.mode === "squad") && state.phase !== "setup") return;
    let alive = true;
    void getFocusLobby().then((result) => {
      if (alive) setLobby(result);
    });
    return () => {
      alive = false;
    };
  }, [state.phase, state.mode]);

  const quoteSeconds = state.phase === "finishEarly" || state.phase === "interrupted" ? Math.round(state.focusedMs / 1000) : null;
  useEffect(() => {
    if (quoteSeconds === null) return;
    let alive = true;
    void quoteFocusXp(quoteSeconds).then((xp) => {
      if (alive) setQuote(xp);
    });
    return () => {
      alive = false;
    };
  }, [quoteSeconds]);

  function start(mode: "solo" | "squad") {
    if (mode === "squad" && lobby) dispatch({ type: "setLength", minutes: lobby.lengthMinutes });
    setMarkedDone("no");
    const sessionKey = newSessionKey();
    dispatch({ type: "start", now: Date.now(), mode, task: setupTask, sessionKey });
    if (!isPreview) announceStart(sessionKey, mode, setupTask?.id ?? null);
  }

  /** Lets the server stamp the start. If it fails (offline), the round still saves, without XP. */
  function announceStart(sessionKey: string, mode: "solo" | "squad", taskId: string | null) {
    const plannedMinutes = mode === "squad" && lobby ? lobby.lengthMinutes : state.lengthMinutes;
    void startFocusSession(sessionKey, { plannedMinutes, mode, taskId }).catch(() => undefined);
  }

  function goHome() {
    clearFocus();
    dispatch({ type: "reset" });
    router.push("/home");
  }

  async function markTaskDone() {
    const task = state.task;
    if (!task) return;
    if (task.isTodayTask) await today.completeTask(task.id);
    setMarkedDone("yes");
  }

  const ariFace = (
    <span className="block h-full w-full overflow-hidden rounded-full bg-[#f4ecdf]">
      <Image src={art.face} alt="Ari" width={120} height={120} className="h-full w-full object-cover" />
    </span>
  );

  // ------------------------------------------------------------------ screens
  switch (state.phase) {
    case "choose":
      return (
        <FocusFrame>
          <ChooseTask
            todayTasks={todayTasks}
            weekTasks={(planner.data?.allTasks ?? []).filter((task) => task.group === "thisWeek" && !task.isDone)}
            goals={planner.data?.goals ?? []}
            current={setupTask}
            onBack={() => dispatch({ type: "closeChoose" })}
            onPick={(task) => dispatch({ type: "chooseTask", choice: task ? { kind: "task", task } : { kind: "none" } })}
          />
        </FocusFrame>
      );

    case "lobby": {
      const startsIn = lobby && now ? Math.max(0, lobby.startsInSeconds * 1000 - (now - (state.lobbyOpenedAt ?? now))) : null;
      const ready = lobby?.members.filter((member) => member.status === "ready").length ?? 0;
      return (
        <FocusFrame>
          <FocusHeader
            onBack={() => dispatch({ type: "leaveLobby" })}
            kicker={`Focus · ${squadName}`}
            title="Focus together?"
            subtitle={lobby ? `${ready} friends are about to start a ${lobby.lengthMinutes}-minute session.` : "Checking who is around…"}
          />
          <div className="mt-6 flex flex-col gap-4">
            <AriCard
              art={art.full}
              label={startsIn === null ? "Starting soon" : startsIn > 0 ? `Starts in ${clock(startsIn)}` : "Starting now"}
              title={`${squadName} · ${lobby?.lengthMinutes ?? state.lengthMinutes} min`}
              body={'Everyone works on their own thing. Only "focusing" is shared.'}
            />
            <Glass>
              <GlassLabel>In the lobby</GlassLabel>
              <ul className="divide-y divide-white/10">
                {(lobby?.members ?? []).map((member) => (
                  <li key={member.id} className="flex items-center gap-3 py-3">
                    <FaceAvatar name={member.name} src={FACES[member.name]} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-body font-bold">{member.name}</p>
                      <p className="font-heading text-meta text-white/70">
                        {member.status === "ready" ? `Ready · ${member.note}` : member.note}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 font-heading text-meta",
                        member.status === "ready" ? "bg-[#1f6a55]/40 text-[#5fd3a8]" : "bg-white/10 text-white/80",
                      )}
                    >
                      {member.status === "ready" ? "Ready" : "Waiting"}
                    </span>
                  </li>
                ))}
              </ul>
            </Glass>
            <FocusButton disabled={!lobby} onClick={() => start("squad")}>
              Join · start together
            </FocusButton>
            <FocusButton tone="ghost" onClick={() => start("solo")}>
              Go solo instead
            </FocusButton>
          </div>
        </FocusFrame>
      );
    }

    case "active":
      if (state.mode === "squad") {
        const others = lobby?.members.filter((member) => member.status === "ready") ?? [];
        return (
          <FocusFrame>
            <FocusHeader
              onBack={() => dispatch({ type: "askFinishEarly", now: Date.now() })}
              backLabel="End session"
              kicker={`Focusing with ${squadName}`}
              title={<span aria-live="off">{clock(remaining)} left</span>}
              subtitle={state.task?.title ?? "Focusing without a task"}
            />
            <div className="mt-6 flex flex-col gap-4">
              <AriCard art={art.full} label="You and Ari" title="Stay with this one thing." body="Phone face down. Ari is focusing too." />
              <Glass>
                <GlassLabel>Focusing now · {others.length + 1}</GlassLabel>
                <ul className="divide-y divide-white/10">
                  {others.map((member) => (
                    <li key={member.id} className="flex items-center gap-3 py-3">
                      <FaceAvatar name={member.name} src={FACES[member.name]} size={40} />
                      <div className="flex-1">
                        <p className="font-heading text-body font-bold">{member.name}</p>
                        <p className="font-heading text-meta text-white/70">Focusing</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 font-heading text-meta">{clock(remaining)}</span>
                    </li>
                  ))}
                </ul>
              </Glass>
              <FocusButton onClick={() => dispatch({ type: "pause", now: Date.now() })}>Pause</FocusButton>
              <FocusButton tone="ghost" onClick={() => dispatch({ type: "askFinishEarly", now: Date.now() })}>
                End session
              </FocusButton>
              <p className="rounded-[20px] border border-white/10 bg-white/[0.07] p-4 font-heading text-label text-white/85">
                No chat during focus. You can send a cheer when the session ends.
              </p>
            </div>
          </FocusFrame>
        );
      }
      return (
        <FocusFrame>
          <div className="flex items-center justify-between">
            <Logo variant="dark" />
            <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 font-heading text-meta text-white/85">Solo session</span>
          </div>
          <p className="mt-6 font-heading text-meta tracking-wide text-white/75 uppercase sm:text-center">Your quiet corner</p>
          <h1 className="mt-1 font-display text-title font-extrabold sm:text-center">Just this one thing.</h1>
          <p className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.08] px-4 py-3 font-heading text-label font-bold">
            {state.task ? `${state.task.title} · ${state.task.detail?.includes("shared") ? "Shared" : "Private"}` : "No task · just focus"}
          </p>
          <div className="mt-6">
            <FocusRing progress={focused / (state.lengthMinutes * 60_000)}>
              <p className="font-heading text-meta tracking-wide text-white/75 uppercase">Time to focus</p>
              <p className="font-display text-[56px] leading-none font-extrabold tabular-nums" role="timer" aria-live="off">
                {clock(remaining)}
              </p>
              <p className="mt-2 font-heading text-meta text-white/75">
                of {clock(state.lengthMinutes * 60_000)} · {shortDuration(focused)} focused
              </p>
            </FocusRing>
          </div>
          <div className="mx-auto mt-6 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.08] py-2 pr-5 pl-2">
            <span className="h-11 w-11 shrink-0 rounded-full ring-2 ring-white/70">{ariFace}</span>
            <span>
              <span className="block font-heading text-label font-bold">Ari is focusing with you</span>
              <span className="block font-heading text-meta text-white/70">Quiet soundscape · off</span>
            </span>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <FocusButton tone="light" onClick={() => dispatch({ type: "pause", now: Date.now() })}>
              Pause session
            </FocusButton>
            <div className="flex gap-3">
              <FocusButton tone="ghost" onClick={() => void save("break")}>
                Take a break
              </FocusButton>
              <FocusButton tone="ghost" onClick={() => dispatch({ type: "askFinishEarly", now: Date.now() })}>
                Finish early
              </FocusButton>
            </div>
            <p className="text-center font-heading text-meta text-white/65">Active focus time only. No pressure to be perfect.</p>
          </div>
        </FocusFrame>
      );

    case "paused":
      return (
        <FocusFrame>
          <FocusHeader
            onBack={() => dispatch({ type: "resume", now: Date.now() })}
            backLabel="Resume"
            kicker="Focus · Paused"
            title={`Paused at ${clock(remaining)}.`}
            subtitle="Take the moment you need."
          />
          <div className="mt-6 flex flex-col gap-4">
            <AriCard
              art={art.full}
              label="Ari is waiting"
              title="Ready when you are."
              body="Paused sessions auto-end after 15 minutes, and the time so far still counts."
            />
            <div className="flex gap-3">
              <StatTile value={clock(focused)} label="done so far" />
              <StatTile value={clock(remaining)} label="left" />
            </div>
            <FocusButton onClick={() => dispatch({ type: "resume", now: Date.now() })}>Resume</FocusButton>
            <FocusButton tone="ghost" onClick={() => void save("complete")}>
              End &amp; save {Math.round(focused / 60_000)} min
            </FocusButton>
          </div>
        </FocusFrame>
      );

    case "finishEarly":
      return (
        <FocusFrame>
          <FocusHeader
            onBack={() => dispatch({ type: "keepGoing", now: Date.now() })}
            backLabel="Keep going"
            kicker="Focus · Finish early"
            title={`Finish at ${Math.floor(focused / 60_000)} minutes?`}
            subtitle="That’s still real work."
          />
          <div className="mt-6 flex flex-col gap-5">
            <div className="flex gap-3">
              <StatTile value={clock(focused)} label="focused" />
              <StatTile value={quote === null ? "…" : `+${quote}`} label="XP" />
              <StatTile value={`${Math.round((focused / (state.lengthMinutes * 60_000)) * 100)}%`} label="of plan" />
            </div>
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-3 font-heading text-label font-bold">Why are you stopping? · optional</legend>
              <div className="flex flex-wrap gap-2">
                {REASONS.map((reason) => (
                  <DarkPill
                    key={reason.value}
                    selected={state.stopReason === reason.value}
                    onClick={() => dispatch({ type: "setReason", reason: state.stopReason === reason.value ? null : reason.value })}
                  >
                    {reason.label}
                  </DarkPill>
                ))}
              </div>
            </fieldset>
            <FocusButton onClick={() => void save("complete")}>Finish &amp; save</FocusButton>
            <FocusButton tone="ghost" onClick={() => dispatch({ type: "keepGoing", now: Date.now() })}>
              Keep going
            </FocusButton>
          </div>
        </FocusFrame>
      );

    case "saving":
      return (
        <FocusFrame>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center" role="status">
            <span className="h-24 w-24 animate-pulse rounded-full ring-4 ring-white/40">{ariFace}</span>
            <p className="font-heading text-body text-white/85">Saving your session…</p>
          </div>
        </FocusFrame>
      );

    case "complete": {
      const seconds = state.result?.focusedSeconds ?? Math.round(state.focusedMs / 1000);
      const minutes = Math.round(seconds / 60);
      return (
        <FocusFrame>
          <div className="relative mx-auto mt-4 grid h-52 w-52 place-items-center rounded-full bg-[conic-gradient(from_200deg,#ffe3a3,#cbb6f6,#f6d7a6,#ffe3a3)] p-4 shadow-[0_0_60px_rgba(203,182,246,.45)]">
            <span className="block h-full w-full rounded-full bg-[#2f1d66] p-3">
              <span className="animate-companion-hello block h-full w-full rounded-full ring-4 ring-[#f3c879]">{ariFace}</span>
            </span>
          </div>
          <h1 className="mt-6 text-center font-display text-title font-extrabold sm:text-display">{minutes} minutes. Done.</h1>
          <p className="mt-2 text-center font-heading text-body text-white/75">You and Ari stayed with it. That counts.</p>
          <div className="mt-6 flex gap-3">
            <StatTile value={clock(seconds * 1000)} label="focused" />
            <StatTile value={`+${state.result?.xpAwarded ?? 0}`} label="XP" highlight />
            <StatTile value={hoursMinutes(state.result?.weekFocusedMinutes ?? 0)} label="this week" />
          </div>
          {state.task ? (
            <Glass className="mt-4">
              {markedDone === "no" ? (
                <>
                  <p className="font-heading text-body font-bold">Did you finish “{state.task.title}”?</p>
                  <div className="mt-3 flex gap-3">
                    <FocusButton className="py-3" onClick={() => void markTaskDone()}>
                      Yes, mark done
                    </FocusButton>
                    <FocusButton tone="ghost" className="py-3" onClick={() => setMarkedDone("notYet")}>
                      Not yet
                    </FocusButton>
                  </div>
                </>
              ) : (
                <p className="flex items-center gap-2 font-heading text-body">
                  <CheckIcon className="h-5 w-5 text-[#5fd3a8]" />
                  {markedDone === "yes"
                    ? state.task.isTodayTask
                      ? `“${state.task.title}” is done. Ari felt that one.`
                      : "Noted. Tick it off in your plan when it is."
                    : "No problem. It stays on your list."}
                </p>
              )}
            </Glass>
          ) : null}
          <div className="mt-auto flex flex-col gap-3 pt-8">
            {state.breakMinutes > 0 ? (
              <FocusButton tone="light" onClick={() => dispatch({ type: "startBreak", now: Date.now() })}>
                Take a {state.breakMinutes}-min break
              </FocusButton>
            ) : null}
            <FocusButton tone="ghost" onClick={goHome}>
              Back to today
            </FocusButton>
          </div>
        </FocusFrame>
      );
    }

    case "break": {
      const left = now ? Math.max(0, (state.breakEndsAt ?? 0) - now) : (state.breakMinutes || 5) * 60_000;
      const water = today.data?.habits.find((habit) => habit.icon === "water");
      return (
        <FocusFrame>
          <FocusHeader
            onBack={goHome}
            backLabel="Finish for now"
            kicker="Focus · Break"
            title={`${Math.max(1, state.breakMinutes || 5)}-minute break.`}
            subtitle={left > 0 ? `${clock(left)} left. Step away from the screen.` : "Break's over. Ready when you are."}
          />
          <div className="mt-6 flex flex-col gap-4">
            <AriCard art={art.full} label="Break" title="Stretch, sip, breathe." body="The next round starts after the break, only if you want it." />
            <Glass>
              <GlassLabel>Small ideas</GlassLabel>
              <ul className="divide-y divide-white/10">
                <li>
                  <button
                    type="button"
                    disabled={!water || waterAdded}
                    onClick={() => {
                      if (!water) return;
                      void today.incrementHabit(water.id).then(() => setWaterAdded(true));
                    }}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <IdeaIcon>{waterAdded ? <CheckIcon className="h-5 w-5" /> : <WaterIcon className="h-5 w-5" />}</IdeaIcon>
                    <span>
                      <span className="block font-heading text-body font-bold">Drink some water</span>
                      <span className="block font-heading text-meta text-white/70">
                        {waterAdded ? "Added to your water habit" : "Counts toward your water habit"}
                      </span>
                    </span>
                  </button>
                </li>
                <li className="flex items-center gap-3 py-3">
                  <IdeaIcon>
                    <MoveIcon className="h-5 w-5" />
                  </IdeaIcon>
                  <span>
                    <span className="block font-heading text-body font-bold">Stand and stretch</span>
                    <span className="block font-heading text-meta text-white/70">1 minute</span>
                  </span>
                </li>
                <li className="flex items-center gap-3 py-3">
                  <IdeaIcon>
                    <SparkleIcon className="h-5 w-5" />
                  </IdeaIcon>
                  <span>
                    <span className="block font-heading text-body font-bold">Look outside</span>
                    <span className="block font-heading text-meta text-white/70">Rest your eyes</span>
                  </span>
                </li>
              </ul>
            </Glass>
            <FocusButton
              onClick={() => {
                setMarkedDone("no");
                const sessionKey = newSessionKey();
                dispatch({ type: "nextRound", now: Date.now(), sessionKey });
                if (!isPreview) announceStart(sessionKey, state.mode, state.task?.id ?? null);
              }}
            >
              Start next round
            </FocusButton>
            <FocusButton tone="ghost" onClick={goHome}>
              Finish for now
            </FocusButton>
          </div>
        </FocusFrame>
      );
    }

    case "interrupted": {
      const closedAt = state.closedAt ? new Date(state.closedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "earlier";
      const minutes = Math.round(state.focusedMs / 60_000);
      return (
        <FocusFrame>
          <FocusHeader onBack={goHome} kicker="Focus · Interrupted" title="Your session was interrupted." subtitle={`The app closed at ${closedAt}. Nothing is lost.`} />
          <div className="mt-6 flex flex-col gap-4">
            <WarnCard title={`${minutes} minutes saved`}>We kept the time you focused before the app closed.</WarnCard>
            <Glass>
              <GlassLabel>What next?</GlassLabel>
              <ul className="divide-y divide-white/10">
                <NextRow
                  icon={<PlayIcon className="h-5 w-5" />}
                  title="Continue the session"
                  detail={`${Math.max(1, Math.round(remainingAt(state, 0) / 60_000))} minutes left`}
                  onClick={() => dispatch({ type: "continueInterrupted", now: Date.now() })}
                />
                <NextRow
                  icon={<CheckIcon className="h-5 w-5" />}
                  title={`Save ${minutes} minutes and stop`}
                  detail={quote === null ? "Working out XP…" : `+${quote} XP`}
                  onClick={() => void save("complete")}
                />
                <NextRow icon={<SparkleIcon className="h-5 w-5" />} title="Discard this session" detail="Nothing is recorded" onClick={goHome} />
              </ul>
            </Glass>
          </div>
        </FocusFrame>
      );
    }

    case "offline":
      return (
        <FocusFrame>
          <FocusHeader onBack={() => router.push("/home")} kicker="Focus · Offline" title="Saved on this device." subtitle="We’ll sync when you’re back online." />
          <div className="mt-6 flex flex-col gap-4">
            <WarnCard title="You’re offline">
              {Math.round(state.focusedMs / 60_000)} minutes are waiting to sync. Your squad will see &quot;focused&quot; once it&apos;s sent.
            </WarnCard>
            <div className="flex gap-3">
              <StatTile value={clock(state.focusedMs)} label="focused" />
              <StatTile value="Soon" label="XP pending" />
            </div>
            <FocusButton onClick={() => router.push("/home")}>Back to today</FocusButton>
            <FocusButton tone="ghost" onClick={() => void save("complete")}>
              Try syncing now
            </FocusButton>
          </div>
        </FocusFrame>
      );

    case "saveError":
      return (
        <FocusFrame>
          <FocusHeader
            onBack={() => router.push("/home")}
            kicker="Focus · Save error"
            title="Couldn’t save this session."
            subtitle={`Your ${Math.round(state.focusedMs / 60_000)} minutes are kept on this device.`}
          />
          <div className="mt-6 flex flex-col gap-4">
            <WarnCard title="Something went wrong saving">Nothing is lost. Try again now, or we’ll retry automatically.</WarnCard>
            <FocusButton onClick={() => void save("complete")}>Try again</FocusButton>
            <FocusButton tone="ghost" onClick={() => router.push("/home")}>
              Save later
            </FocusButton>
          </div>
        </FocusFrame>
      );

    default:
      return (
        <FocusFrame>
          <div className="grid grid-cols-3 items-center font-heading text-label font-bold">
            <Link href="/home" className="text-white/80">
              Close
            </Link>
            <span className="text-center">Focus</span>
            <button type="button" className="text-right text-white/80" onClick={() => dispatch({ type: "openLobby", now: Date.now() })}>
              Squad
            </button>
          </div>
          <span className="mx-auto mt-5 block h-24 w-24 rounded-full ring-4 ring-white/80 shadow-floating">{ariFace}</span>
          <h1 className="mt-4 text-center font-display text-title font-extrabold">What are we focusing on?</h1>
          <p className="mt-1 text-center font-heading text-label text-white/75">Ari will sit with you the whole time.</p>

          <GlassLabel>
            <span className="mt-6 block">Task</span>
          </GlassLabel>
          <Glass className="flex items-center gap-3">
            <span aria-hidden className="h-3 w-3 shrink-0 rounded-full bg-[#d9ccfb]" />
            <div className="min-w-0 flex-1">
              <p className="font-heading text-body font-bold">{setupTask?.title ?? (today.isLoading ? "Loading today…" : "No task · just focus")}</p>
              <p className="font-heading text-meta text-white/70">{setupTask?.detail ?? "Focusing without a task still counts."}</p>
            </div>
            <button type="button" onClick={() => dispatch({ type: "openChoose" })} className="font-heading text-label font-bold text-[#d9ccfb]">
              Change
            </button>
          </Glass>

          <GlassLabel>
            <span className="mt-5 block">Length</span>
          </GlassLabel>
          <div role="radiogroup" aria-label="Session length" className="grid grid-cols-4 gap-2">
            {LENGTH_OPTIONS.map((minutes) => {
              const selected = state.lengthMinutes === minutes;
              return (
                <button
                  key={minutes}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => dispatch({ type: "setLength", minutes })}
                  className={cn(
                    "flex flex-col items-center rounded-[22px] py-4 transition",
                    selected ? "bg-[linear-gradient(180deg,#9b7be8,#6b46c9)] shadow-[0_6px_0_#4c319b]" : "border border-white/10 bg-white/[0.07]",
                  )}
                >
                  <span className="font-display text-title font-extrabold">{minutes}</span>
                  <span className="font-heading text-meta text-white/75">min</span>
                </button>
              );
            })}
          </div>

          <Glass className="mt-5 divide-y divide-white/10 py-1">
            <SettingRow
              label="Short break after"
              value={state.breakMinutes ? `${state.breakMinutes} min` : "Off"}
              onClick={() => dispatch({ type: "cycleBreak" })}
              hint={`Tap to switch: ${BREAK_OPTIONS.map((option) => (option ? `${option} min` : "off")).join(", ")}`}
            />
            <SettingRow label="Quiet soundscape" value="Off · coming later" />
            <SettingRow
              label="Who sees it"
              value={state.shareFocusing ? `${squadName} sees “focusing”` : "Only you"}
              onClick={() => dispatch({ type: "toggleShare" })}
              hint="Only the word focusing is shared, never the task."
            />
          </Glass>

          <div className="mt-auto flex flex-col gap-3 pt-8">
            <FocusButton tone="light" disabled={today.isLoading} onClick={() => start("solo")}>
              Start {state.lengthMinutes} minutes
            </FocusButton>
            <button
              type="button"
              onClick={() => dispatch({ type: "openLobby", now: Date.now() })}
              className="py-2 font-heading text-label font-bold text-[#d9ccfb]"
            >
              Or focus together
              {lobby ? ` · ${lobby.members.filter((member) => member.status === "ready").length} in ${squadName} now` : ""}
            </button>
            {isPreview ? null : (
              <p className="text-center font-heading text-meta text-white/55">Your sessions and XP are saved to your account. The squad lobby still shows example members.</p>
            )}
          </div>
        </FocusFrame>
      );
  }
}

function IdeaIcon({ children }: { children: ReactNode }) {
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-[#b9a3f0]">{children}</span>;
}

function SettingRow({ label, value, onClick, hint }: { label: string; value: string; onClick?: () => void; hint?: string }) {
  const content = (
    <>
      <span className="font-heading text-body font-bold">{label}</span>
      <span className="font-heading text-meta text-white/80">{value}</span>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} title={hint} className="flex w-full items-center justify-between gap-3 py-3 text-left">
      {content}
    </button>
  ) : (
    <div className="flex items-center justify-between gap-3 py-3">{content}</div>
  );
}

function NextRow({ icon, title, detail, onClick }: { icon: ReactNode; title: string; detail: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-3 text-left">
        <IdeaIcon>{icon}</IdeaIcon>
        <span className="flex-1">
          <span className="block font-heading text-body font-bold">{title}</span>
          <span className="block font-heading text-meta text-white/70">{detail}</span>
        </span>
        <ChevronRightIcon className="h-4 w-4 text-white/70" />
      </button>
    </li>
  );
}

function ChooseTask({
  todayTasks,
  weekTasks,
  goals,
  current,
  onBack,
  onPick,
}: {
  todayTasks: Task[];
  weekTasks: { id: string; title: string; detail: string }[];
  goals: { id: string; title: string; detail: string }[];
  current: FocusTaskRef | null;
  onBack: () => void;
  onPick: (task: FocusTaskRef | null) => void;
}) {
  const [tab, setTab] = useState<"today" | "week" | "goals">("today");
  const [picked, setPicked] = useState<FocusTaskRef | null>(current);

  const options = useMemo<FocusTaskRef[]>(() => {
    if (tab === "today") {
      return todayTasks
        .filter((task) => !task.isDone)
        .map((task) => ({
          ...taskRef(task),
          detail: [task.durationMinutes ? `${task.durationMinutes} min` : null, task.goalName ?? task.category, task.isShared ? `${task.sharedByName ?? "Squad"} shared` : null]
            .filter(Boolean)
            .join(" · "),
        }));
    }
    if (tab === "week") return weekTasks.map((task) => ({ id: task.id, title: task.title, detail: task.detail, isTodayTask: false }));
    return goals.map((goal) => ({ id: goal.id, title: goal.title, detail: goal.detail, isTodayTask: false }));
  }, [tab, todayTasks, weekTasks, goals]);

  return (
    <>
      <FocusHeader onBack={onBack} kicker="Focus · Setup" title="What are we focusing on?" subtitle="Pick from today, or focus without a task." />
      <div className="mt-5 flex gap-2" role="group" aria-label="Where to pick from">
        <DarkPill selected={tab === "today"} onClick={() => setTab("today")}>
          Today
        </DarkPill>
        <DarkPill selected={tab === "week"} onClick={() => setTab("week")}>
          This week
        </DarkPill>
        <DarkPill selected={tab === "goals"} onClick={() => setTab("goals")}>
          Goals
        </DarkPill>
      </div>
      <Glass className="mt-4">
        <GlassLabel>{tab === "today" ? "Today" : tab === "week" ? "This week" : "Goals"}</GlassLabel>
        {options.length === 0 ? (
          <p className="py-3 font-heading text-label text-white/75">Nothing open here.</p>
        ) : (
          <ul role="radiogroup" aria-label="Tasks" className="divide-y divide-white/10">
            {options.map((option) => {
              const selected = picked?.id === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPicked(option)}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full",
                        selected ? "bg-[linear-gradient(180deg,#9b7be8,#6b46c9)] text-white" : "bg-[radial-gradient(circle_at_35%_30%,#fff,#d8cff0)]",
                      )}
                    >
                      {selected ? <CheckIcon className="h-4 w-4" /> : null}
                    </span>
                    <span>
                      <span className="block font-heading text-body font-bold">{option.title}</span>
                      <span className="block font-heading text-meta text-white/70">{option.detail}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Glass>
      <div className="mt-5 flex flex-col gap-3">
        <FocusButton disabled={!picked} onClick={() => onPick(picked)}>
          Use this task
        </FocusButton>
        <FocusButton tone="ghost" onClick={() => onPick(null)}>
          Focus without a task
        </FocusButton>
        <p className="rounded-[20px] border border-white/10 bg-white/[0.07] p-4 font-heading text-label text-white/85">
          Focusing without a task still counts. You can link it to one afterwards.
        </p>
      </div>
    </>
  );
}
