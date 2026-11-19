"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { STAGE_ART } from "../companion";
import { useShell } from "../home/AppShell";
import { useToday } from "../hooks";
import { cn } from "../lib/cn";
import { getCheckInStatus, getPlanner, saveCheckIn } from "../mocks/repository";
import type { CheckInStatus, Effort, Mood } from "../mocks/types";

const MOODS: { value: Mood; label: string; face: string; orb: string }[] = [
  { value: "heavy", label: "Heavy", face: "︶", orb: "bg-[radial-gradient(circle_at_35%_30%,#ffffff,#b8c3d6)]" },
  { value: "low", label: "Low", face: "–", orb: "bg-[radial-gradient(circle_at_35%_30%,#ffffff,#bdb2e6)]" },
  { value: "okay", label: "Okay", face: "‿", orb: "bg-[radial-gradient(circle_at_35%_30%,#ffffff,#d9cff5)]" },
  { value: "good", label: "Good", face: "◡", orb: "bg-[radial-gradient(circle_at_35%_30%,#c9b6f6,#6b46c9)]" },
  { value: "bright", label: "Bright", face: "◡", orb: "bg-[radial-gradient(circle_at_35%_30%,#ffe2c2,#f4a259)]" },
];

const EFFORTS: { value: Effort; label: string }[] = [
  { value: "rest", label: "Rest" },
  { value: "light", label: "Light" },
  { value: "steady", label: "Steady" },
  { value: "strong", label: "Strong" },
  { value: "allIn", label: "All in" },
];

function partOfDay(date: Date): string {
  const hour = date.getHours();
  const day = date.toLocaleDateString("en-GB", { weekday: "long" });
  return `${day} ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}`;
}

/** Figma 05 · Daily Check-in. Two minutes, no right answers. */
export function CheckInScreen() {
  const router = useRouter();
  const { showToast } = useShell();
  const today = useToday();
  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const [squadName, setSquadName] = useState("your squad");
  const [mood, setMood] = useState<Mood | null>(null);
  const [effort, setEffort] = useState<Effort>("steady");
  const [win, setWin] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [share, setShare] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kicker, setKicker] = useState("Check-in");

  useEffect(() => {
    let alive = true;
    void getCheckInStatus().then((result) => {
      if (alive) setStatus(result);
    });
    void getPlanner().then((planner) => {
      if (alive) setSquadName(planner.squadName);
    });
    const id = window.setTimeout(() => {
      if (alive) setKicker(`Check-in · ${partOfDay(new Date())}`);
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, []);

  const art = STAGE_ART[today.data?.companion.stage ?? "teen"];

  async function save() {
    if (!mood) {
      setError("Pick the mood closest to now. Any one is fine.");
      return;
    }
    setSaving(true);
    try {
      const result = await saveCheckIn({ mood, effort, win, obstacle, shareCheckedIn: share });
      showToast(result.xpAwarded ? `Checked in. +${result.xpAwarded} XP for Ari.` : "Check-in updated.");
      router.push("/home");
    } catch {
      setError("Couldn't save just now. Your words are still here, try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pt-7 pb-36 sm:px-8 md:pt-10 md:pb-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-heading text-meta font-bold tracking-widest text-text-muted uppercase">{kicker}</p>
          <h1 className="mt-1 font-display text-display font-extrabold text-text">How did today feel?</h1>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Close check-in"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface font-heading text-heading text-text shadow-raised"
        >
          ✕
        </button>
      </header>

      <form
        className="mt-5 grid gap-5 lg:grid-cols-2 lg:gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="flex flex-col gap-5">
          <section className="flex items-center gap-3 rounded-[24px] bg-[#f8efdf] p-4 shadow-raised">
            <span className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface ring-[3px] ring-white">
              <Image src={art.face} alt="" width={56} height={56} className="h-full w-full object-cover" />
            </span>
            <span>
              <span className="block font-heading text-body font-bold text-text">No right answers.</span>
              <span className="block font-heading text-label text-text-muted">
                {status?.doneToday ? "You already checked in today. Changing it is fine." : "Just notice. Two minutes, then rest."}
              </span>
            </span>
          </section>

          <fieldset className="m-0 border-0 p-0">
            <legend className="font-heading text-body font-bold text-text">Mood</legend>
            <p className="font-heading text-meta text-text-muted">Pick the one closest to now</p>
            <div role="radiogroup" aria-label="Mood" className="mt-3 grid grid-cols-5 gap-2">
              {MOODS.map((item) => {
                const selected = mood === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setMood(item.value);
                      setError(null);
                    }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        "grid h-14 w-14 place-items-center rounded-full font-heading text-heading text-text shadow-raised transition",
                        item.orb,
                        selected ? "scale-110 ring-4 ring-white outline outline-2 outline-accent" : "",
                      )}
                      aria-hidden
                    >
                      {item.face}
                    </span>
                    <span className={cn("font-heading text-meta", selected ? "font-bold text-accent-strong" : "text-text-muted")}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="m-0 border-0 p-0">
            <legend className="font-heading text-body font-bold text-text">Effort</legend>
            <p className="font-heading text-meta text-text-muted">How much did you give today?</p>
            <div role="radiogroup" aria-label="Effort" className="mt-3 flex rounded-full bg-accent-tint/70 p-1 shadow-inset">
              {EFFORTS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={effort === item.value}
                  onClick={() => setEffort(item.value)}
                  className={cn(
                    "flex-1 rounded-full py-2.5 font-heading text-label transition",
                    effort === item.value ? "bg-[image:var(--gradient-primary)] font-bold text-white shadow-pressable" : "text-text-muted",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex flex-col gap-5">
          <label className="block">
            <span className="mb-2 block font-heading text-body font-bold text-text">One win from today</span>
            <textarea
              value={win}
              maxLength={500}
              rows={3}
              onChange={(event) => setWin(event.target.value)}
              placeholder="Something small counts."
              className="w-full resize-none rounded-[22px] bg-surface px-5 py-4 font-heading text-body text-text shadow-raised placeholder:text-text-muted"
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-heading text-body font-bold text-text">Anything in the way?</span>
            <textarea
              value={obstacle}
              maxLength={500}
              rows={3}
              onChange={(event) => setObstacle(event.target.value)}
              placeholder="Optional · only you will see this"
              className="w-full resize-none rounded-[22px] bg-surface px-5 py-4 font-heading text-body text-text shadow-raised placeholder:text-text-muted"
            />
          </label>
          <section className="flex items-center justify-between gap-4 rounded-[22px] bg-accent-tint p-4">
            <span>
              <span className="block font-heading text-body font-bold text-text">Tell {squadName} I checked in</span>
              <span className="block font-heading text-meta text-text-muted">Only &quot;checked in&quot; is shared. Your mood and words stay yours.</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={share}
              aria-label={`Tell ${squadName} I checked in`}
              onClick={() => setShare((value) => !value)}
              className={cn("relative h-8 w-14 shrink-0 rounded-full transition", share ? "bg-[image:var(--gradient-primary)] shadow-pressable" : "bg-surface shadow-inset")}
            >
              <span className={cn("absolute top-1 h-6 w-6 rounded-full bg-surface shadow-raised transition-all", share ? "left-7" : "left-1")} />
            </button>
          </section>
          {error ? (
            <p role="alert" className="font-heading text-label text-warning">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-primary)] py-4 font-heading text-body font-bold text-white shadow-pressable disabled:opacity-60"
          >
            Save check-in
            {status?.xpForCheckIn ? <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-meta">+{status.xpForCheckIn} XP</span> : null}
          </button>
          <p className="font-heading text-meta text-text-muted">Preview: check-ins here are examples, not saved account data yet.</p>
        </div>
      </form>
    </main>
  );
}
