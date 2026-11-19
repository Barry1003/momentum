import type { RHYTHMS } from "./validation";

export type Rhythm = (typeof RHYTHMS)[number];
export type Quadrant = "doNext" | "planTime" | "reconsider" | "leaveRoom";

export const DEFAULT_AREAS = [
  { id: "rest", name: "Rest & recovery", icon: "rest" },
  { id: "learning", name: "Learning", icon: "learning" },
  { id: "work", name: "Work & purpose", icon: "work" },
  { id: "people", name: "Friends & family", icon: "people" },
  { id: "health", name: "Health & body", icon: "health" },
  { id: "money", name: "Money", icon: "money" },
  { id: "home", name: "Home & space", icon: "home" },
] as const;

/** The reflection prompts. Only the answers are stored, per person. */
export const QUESTIONS = [
  ["Money", "How do you feel about money right now?", "Spending, saving, the worry or the calm."],
  ["Energy", "When do you have the most energy?", "Times of day, people, places."],
  ["Daily habits", "What do your days actually look like right now?", "Mornings, evenings, the small things you repeat without thinking."],
  ["Avoiding", "What have you been putting off?", "No judgement. Just name it."],
  ["One year from now", "What would you love to be true a year from now?", "Big or small."],
  ["What got in the way", "What got in the way last time you tried?", "Time, energy, other people, yourself."],
  ["Practice", "What do you practise without being asked?", "The things you return to."],
  ["Feedback", "Who do you show your work to?", "Or who would you like to?"],
  ["Health", "How is your body feeling these days?", "Sleep, movement, food."],
  ["Mindset", "What do you tell yourself when things get hard?", "The voice in your head."],
  ["Time", "Where does your time go that you wish it didn’t?", "Be honest, not harsh."],
  ["Projects", "What would you build if nobody was watching?", "Anything at all."],
] as const;

export const SUGGESTED_AREA_NAMES = ["Skills", "Practice", "Projects", "Time", "Feedback", "Health", "Money", "Mindset"];

export function questionsWith(answers: Record<string, string>) {
  return QUESTIONS.map(([topic, prompt, hint], index) => {
    const id = `q-${index + 1}`;
    return { id, topic, prompt, hint, answer: answers[id] ?? "" };
  });
}

/** Grid areas suggested from what the person wrote; each may carry a short quote of theirs. */
export function suggestedAreas(answers: Record<string, string>) {
  const questions = questionsWith(answers);
  const quoteFor = (topic: string) => questions.find((q) => q.topic.toLowerCase().includes(topic.toLowerCase()) && q.answer.trim())?.answer.trim() ?? null;
  return SUGGESTED_AREA_NAMES.map((name) => {
    const quote = quoteFor(name);
    return { name, quote: quote ? (quote.length > 60 ? `${quote.slice(0, 57)}…` : quote) : null };
  });
}

export function rhythmForMinutes(minutes: number): Rhythm {
  return minutes <= 30 ? "daily" : minutes <= 120 ? "weekly" : "monthly";
}

// ---------------------------------------------------------------- scheduler

export interface Block { title: string; from: string; to: string }

export const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
export function fromMinutes(total: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, total));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

const CANDIDATES = ["17:30", "07:00", "12:30", "19:00", "08:00", "16:00"];

export function suggestSlot(blocks: Block[], minutes: number): string | null {
  for (const candidate of CANDIDATES) {
    const start = toMinutes(candidate);
    if (!blocks.some((block) => start < toMinutes(block.to) && toMinutes(block.from) < start + minutes)) return candidate;
  }
  return null;
}

/** Whether a time fits the day: a real 24-hour time, ends by midnight, overlaps nothing. */
export function checkSlot(blocks: Block[], time: string, minutes: number) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || toMinutes(time) + minutes > 24 * 60) {
    return { ok: false, reason: "invalid" as const, conflict: null, suggestion: suggestSlot(blocks, minutes) };
  }
  const start = toMinutes(time);
  const clash = blocks.find((block) => start < toMinutes(block.to) && toMinutes(block.from) < start + minutes) ?? null;
  return clash
    ? { ok: false, reason: "conflict" as const, conflict: clash, suggestion: suggestSlot(blocks, minutes) }
    : { ok: true, reason: null, conflict: null, suggestion: null };
}

const FROM_DB: Record<string, Quadrant> = { DO: "doNext", PLAN: "planTime", RECONSIDER: "reconsider", LEAVE: "leaveRoom" };
export const TO_DB = { doNext: "DO", planTime: "PLAN", reconsider: "RECONSIDER", leaveRoom: "LEAVE" } as const;

export function quadrantOf(task: { quadrant: string | null; dueTime: string | null; priority: string }): Quadrant {
  if (task.quadrant && FROM_DB[task.quadrant]) return FROM_DB[task.quadrant] as Quadrant;
  if (task.dueTime) return "doNext";
  return task.priority === "LOW" ? "reconsider" : "planTime";
}

// ---------------------------------------------------------------- 15-day review

export const CYCLE_DAYS = 15;

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Which review is due. Cycle n covers start + 15(n-1) … start + 15n − 1.
 * The latest finished cycle is the one to review; before the first ends, nothing is open yet.
 */
export function reviewWindow(startIso: string, todayIso: string) {
  const days = Math.max(0, Math.round((Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${startIso}T00:00:00Z`)) / 86400000));
  const finished = Math.floor(days / CYCLE_DAYS);
  const cycle = Math.max(1, finished);
  const from = addDays(startIso, CYCLE_DAYS * (cycle - 1));
  const to = addDays(from, CYCLE_DAYS - 1);
  const opensInDays = finished === 0 ? CYCLE_DAYS - days : 0;
  const nextEndsInDays = CYCLE_DAYS - (days % CYCLE_DAYS);
  return { cycle, from, to, opensInDays, nextEndsInDays, nextFrom: addDays(to, 1), nextTo: addDays(to, CYCLE_DAYS) };
}
