export type MilestoneStatus = "reached" | "current" | "later";

/** Reached ones are reached; the first one not reached is current; the rest come later. */
export function milestoneStatuses(milestones: { reachedAt: Date | null }[]): MilestoneStatus[] {
  let currentGiven = false;
  return milestones.map((milestone) => {
    if (milestone.reachedAt) return "reached";
    if (!currentGiven) {
      currentGiven = true;
      return "current";
    }
    return "later";
  });
}

export function shortDay(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function targetLabel(targetDate: Date | null): string {
  return targetDate ? targetDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }) : "no target";
}

/** The small line under a goal's task. */
export function taskDetail(task: { dueDate: Date | null; doneOn: Date | null }, today: string): string {
  if (task.doneOn) return `Done ${shortDay(task.doneOn)}`;
  if (!task.dueDate) return "no date";
  const due = task.dueDate.toISOString().slice(0, 10);
  if (due === today) return "today";
  if (due < today) return `was due ${shortDay(task.dueDate)}`;
  return `due ${shortDay(task.dueDate)}`;
}

export function dueDateFor(when: "today" | "tomorrow" | "pickDate" | "noDate", today: string, picked?: string): string | undefined {
  if (when === "noDate") return undefined;
  if (when === "pickDate") return picked;
  if (when === "tomorrow") {
    const date = new Date(`${today}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  }
  return today;
}
