"use client";

import { useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import type { NewTaskInput, TaskPriority, TaskRepeat, TaskWhen } from "../mocks/types";
import { Pill, SubHeader } from "./parts";

function Choice<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2 font-heading text-label font-bold text-text">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            onClick={() => onChange(option.value)}
          >
            <Pill selected={option.value === value}>{option.label}</Pill>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const WHEN: { value: TaskWhen; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "pickDate", label: "Pick a date" },
  { value: "noDate", label: "No date" },
];

type Duration = "15" | "25" | "45" | "custom";
const DURATIONS: { value: Duration; label: string }[] = [
  { value: "15", label: "15 min" },
  { value: "25", label: "25 min" },
  { value: "45", label: "45 min" },
  { value: "custom", label: "Custom" },
];

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const REPEATS: { value: TaskRepeat; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

type Visibility = "private" | "squad";

export interface AddTaskViewProps {
  squadName: string;
  goals: PlannerGoal[];
  onAdd: (input: NewTaskInput) => Promise<void>;
  onCancel: () => void;
}

/** Figma 03 · Planner · Add a task (details). Private by default. */
export function AddTaskView({ squadName, goals, onAdd, onCancel }: AddTaskViewProps) {
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState<TaskWhen>("today");
  const [duration, setDuration] = useState<Duration>("25");
  const [customMinutes, setCustomMinutes] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [goal, setGoal] = useState<string>("none");
  const [repeats, setRepeats] = useState<TaskRepeat>("never");
  const [selectedDate, setSelectedDate] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function submit() {
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      setError("Give it a short name first.");
      return;
    }
    let minutes: number | undefined;
    if (duration === "custom") {
      const parsed = Number(customMinutes);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 480) {
        setError("Custom time is whole minutes, 1 to 480.");
        return;
      }
      minutes = parsed;
    } else {
      minutes = Number(duration);
    }
    const chosenGoal = goals.find((item) => item.id === goal);
    if (when === "pickDate" && (!/^\\d{4}-\\d{2}-\\d{2}$/.test(selectedDate) || Number.isNaN(Date.parse(selectedDate)))) {
      setError("Choose a valid date."); return;
    }
    setIsSaving(true);
    try {
      await onAdd({
        title: trimmed.slice(0, 120),
        when,
        durationMinutes: minutes,
        priority,
        goalId: chosenGoal?.id,
        goalName: chosenGoal?.title,
        selectedDate: when === "pickDate" ? selectedDate : undefined,
        repeats,
        shareWithSquad: visibility === "squad",
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add the task.");
    } finally {
      setIsSaving(false);
    }
  }

  const sectionGap = "flex flex-col gap-5";
  const left: ReactNode = (
    <div className={sectionGap}>
      <label className="block">
        <span className="mb-2 block font-heading text-label font-bold text-text">Task</span>
        <input
          value={title}
          maxLength={120}
          onChange={(event) => {
            setTitle(event.target.value);
            setError(null);
          }}
          placeholder="Practice TypeScript generics"
          aria-invalid={Boolean(error)}
          className="w-full rounded-[22px] bg-surface px-5 py-4 font-heading text-body text-text shadow-inset outline outline-2 outline-accent placeholder:text-text-muted"
        />
      </label>
      {error ? (
        <p role="alert" className="-mt-3 font-heading text-meta text-warning">
          {error}
        </p>
      ) : null}
      <Choice legend="When" options={WHEN} value={when} onChange={setWhen} />
      {when === "pickDate" ? <input aria-label="Task date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="rounded-input bg-surface px-4 py-3 text-text shadow-inset" /> : null}
      <Choice legend="How long" options={DURATIONS} value={duration} onChange={setDuration} />
      {duration === "custom" ? (
        <label className="-mt-2 flex items-center gap-2 font-heading text-label text-text-muted">
          <input
            inputMode="numeric"
            value={customMinutes}
            onChange={(event) => {
              setCustomMinutes(event.target.value.replace(/\D/g, "").slice(0, 3));
              setError(null);
            }}
            aria-label="Custom minutes"
            className="w-20 rounded-full bg-surface px-4 py-2 text-text shadow-inset"
          />
          minutes
        </label>
      ) : null}
    </div>
  );

  const right: ReactNode = (
    <div className={sectionGap}>
      <Choice legend="Priority" options={PRIORITIES} value={priority} onChange={setPriority} />
      <Choice legend="Goal" options={[{ value: "none", label: "No goal" }, ...goals.map((item) => ({ value: item.id, label: item.title }))]} value={goal} onChange={setGoal} />
      <Choice legend="Repeats" options={REPEATS} value={repeats} onChange={setRepeats} />
      <div>
        <Choice
          legend="Who can see it"
          options={[
            { value: "private" as Visibility, label: "Only me" },
            { value: "squad" as Visibility, label: squadName },
          ]}
          value={visibility}
          onChange={setVisibility}
        />
        <p className="mt-2 font-heading text-meta text-text-muted">Sharing is always a choice, never automatic.</p>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void submit()}
          className={cn(
            "flex-1 rounded-full bg-[image:var(--gradient-primary)] py-4 font-heading text-body font-bold text-white shadow-pressable",
            isSaving ? "opacity-70" : "",
          )}
        >
          Add task
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full bg-surface py-4 font-heading text-body font-bold text-accent-strong shadow-raised"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <>
      <SubHeader kicker="Add a task" title="One small, useful step." subtitle="Private by default." />
      <form
        className="mt-5 grid gap-5 lg:grid-cols-2 lg:gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {left}
        {right}
      </form>
    </>
  );
}
