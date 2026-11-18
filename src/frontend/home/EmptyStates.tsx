"use client";

import type { ReactNode } from "react";
import { Button, Note } from "../components";
import { ChevronRightIcon, PlusIcon, SparkleIcon, WaterIcon } from "./icons";

function ActionRow({ icon, title, body, onClick }: { icon: ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-[22px] bg-surface p-4 text-left shadow-raised transition active:translate-y-0.5"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-tint text-accent-strong">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-body font-bold text-text">{title}</span>
          <span className="block font-heading text-meta text-text-muted">{body}</span>
        </span>
        <ChevronRightIcon className="h-5 w-5 text-text-muted" />
      </button>
    </li>
  );
}

/** Day 1: nothing yet, three gentle ways to begin. */
export function FirstDayActions({
  onAddTask,
  onAddHabit,
  onDirection,
}: {
  onAddTask: () => void;
  onAddHabit: () => void;
  onDirection: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="begin">
        <h2 id="begin" className="mb-3 font-display text-heading font-extrabold text-text">
          Three ways to begin
        </h2>
        <ul className="flex flex-col gap-3">
          <ActionRow icon={<PlusIcon className="h-5 w-5" />} title="Add your first task" body="Something small you can finish today" onClick={onAddTask} />
          <ActionRow icon={<WaterIcon className="h-5 w-5" />} title="Start one gentle habit" body="Water, a walk, reading: 2 minutes counts" onClick={onAddHabit} />
          <ActionRow icon={<SparkleIcon className="h-5 w-5" />} title="Find your direction" body="Growth Studio · optional, private, skippable" onClick={onDirection} />
        </ul>
      </section>
      <Note tone="cream" title="HOW ARI GROWS">
        Every task, habit and focus session earns XP. Ari grows through 5 stages, and growth is never taken away, even
        after a quiet day.
      </Note>
    </div>
  );
}

/** After a few days away: no guilt, one optional tiny step. */
export function QuietDayActions({
  onWater,
  onTask,
  onCheckIn,
  onSayHi,
  onNotToday,
}: {
  onWater: () => void;
  onTask: () => void;
  onCheckIn: () => void;
  onSayHi: () => void;
  onNotToday: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="pick-one">
        <p id="pick-one" className="mb-3 font-heading text-meta font-bold tracking-wide text-accent uppercase">
          Pick one, or none
        </p>
        <ul className="flex flex-col gap-3">
          <ActionRow icon={<WaterIcon className="h-5 w-5" />} title="Drink a glass of water" body="30 seconds" onClick={onWater} />
          <ActionRow icon={<PlusIcon className="h-5 w-5" />} title="Finish one 5-minute task" body="From your list" onClick={onTask} />
          <ActionRow icon={<SparkleIcon className="h-5 w-5" />} title="2-minute check-in" body="How are you, really?" onClick={onCheckIn} />
        </ul>
      </section>
      <div className="flex flex-col gap-3">
        <Button onClick={onSayHi}>Just say hi to Ari</Button>
        <Button variant="secondary" onClick={onNotToday}>
          Not today
        </Button>
      </div>
    </div>
  );
}
