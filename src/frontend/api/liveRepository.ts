import type { CompanionState, ConsistencyMoment, Habit, HabitTracker, HabitsData, NewHabitInput, NewTaskInput, PlannerData, PlannerListTask, Task, TodayData } from "../mocks/types";
import { currentRun, isScheduledOn, isoDate, addDays } from "../mocks/habitRules";

type RawTask = {
 id: string; title: string; dueDate: string | null; dueTime: string | null;
 durationMin: number | null; priority: "NONE" | "LOW" | "MEDIUM" | "HIGH";
 visibility: "PRIVATE" | "SQUAD"; squadId: string | null;
 squad: { name: string } | null; goal: { title: string; area: string | null } | null;
 completions: { occurrenceDate: string }[];
};
type RawHabit = {
 id: string; name: string; description: string | null; icon: string | null;
 unit: string | null; targetType: "CHECK" | "COUNT" | "DURATION"; targetValue: number;
 scheduleDays: number[]; startsOn: string | null; pausedAt: string | null; pausedUntil: string | null;
 status: "ACTIVE" | "PAUSED" | "ARCHIVED"; reminderTime: string | null; sharedWithSquadId: string | null;
};
type RawGoal = { id: string; title: string; status: string; squadId: string | null; targetDate: string | null;
 tasks: { id: string; completions: { id: string }[] }[] };
type Workspace = {
 tasks: RawTask[]; habits: RawHabit[]; goals: RawGoal[];
 habitLogs: { habitId: string; date: string; value: number }[];
 avatar: { stage: string; totalXp: number; xpToNextStage: number | null } | null;
 squads: { squadId: string; squad: { name: string } }[];
};

/** After any XP, let the stage-up and achievement overlays look for something new to show. */
function celebrate(): void {
 if (typeof window === "undefined") return;
 window.dispatchEvent(new Event("momentum:stage-up"));
 window.dispatchEvent(new Event("momentum:achievement"));
}

const dateOnly = (date: string | null | undefined) => date ? date.slice(0, 10) : null;
const localToday = () => isoDate(new Date());

async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
 const response = await fetch(path, {
  method, credentials: "same-origin", cache: "no-store",
  ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
 });
 if (!response.ok) {
  const payload = await response.json().catch(() => null) as { error?: { message?: string } | string } | null;
  const message = typeof payload?.error === "string" ? payload.error : payload?.error?.message;
  throw new Error(message || `Request failed (${response.status})`);
 }
 return response.json() as Promise<T>;
}
const workspace = () => request<Workspace>("/api/workspace");
const stage = (value: string | undefined): CompanionState["stage"] => {
 const stages: Record<string, CompanionState["stage"]> = {
  CHILD: "child", PRETEEN: "preteen", TEEN: "teen", YOUNG_ADULT: "youngAdult", ADULT: "adult",
 };
 return stages[value || ""] || "child";
};
function companion(raw: Workspace): CompanionState {
 return { stage: stage(raw.avatar?.stage), xp: raw.avatar?.totalXp ?? 0, xpToNextStage: raw.avatar ? raw.avatar.xpToNextStage : 400 };
}
function taskOf(raw: RawTask, day = localToday()): Task {
 return {
  id: raw.id, title: raw.title,
  isDone: raw.completions.some(c => dateOnly(c.occurrenceDate) === day),
  time: raw.dueTime ?? undefined, durationMinutes: raw.durationMin ?? undefined,
  priority: raw.priority === "NONE" ? undefined : raw.priority.toLowerCase() as Task["priority"],
  isShared: raw.visibility === "SQUAD", sharedByName: raw.squad?.name ?? undefined,
  goalName: raw.goal?.title ?? undefined, category: raw.goal?.area ?? undefined,
 };
}
function historyOf(raw: Workspace): HabitTracker["history"] {
 const history: HabitTracker["history"] = {};
 for (const item of raw.habitLogs) {
  const day = dateOnly(item.date);
  if (!day) continue;
  (history[item.habitId] ??= {})[day] = item.value;
 }
 return history;
}
function habitOf(raw: RawHabit, history: HabitTracker["history"], day = localToday()): Habit {
 const scheduleDays = raw.scheduleDays?.length ? raw.scheduleDays : [0,1,2,3,4,5,6];
 const startsOn = dateOnly(raw.startsOn) ?? undefined;
 const pausedUntil = dateOnly(raw.pausedUntil);
 const pausedNow = raw.status === "PAUSED" && (!pausedUntil || pausedUntil >= day);
 const pausedFrom = pausedNow ? dateOnly(raw.pausedAt) : null;
 return {
  id: raw.id, name: raw.name, detail: raw.description ?? (raw.targetType === "DURATION" ? `${raw.targetValue} min` : undefined),
  icon: (["water","move","read","sparkle"].includes(raw.icon ?? "") ? raw.icon : "sparkle") as Habit["icon"],
  targetCount: raw.targetValue, completedCount: history[raw.id]?.[day] ?? 0,
  kind: raw.targetType === "COUNT" ? "target" : raw.targetType === "DURATION" ? "timer" : "tick",
  unit: raw.unit ?? undefined, scheduleDays, startsOn, pausedFrom, pausedUntil,
  isScheduledToday: !pausedNow && raw.status !== "ARCHIVED" && isScheduledOn({scheduleDays,targetCount:raw.targetValue,startsOn,pausedFrom,pausedUntil},day),
  reminderTime: raw.reminderTime, shareWithSquad: Boolean(raw.sharedWithSquadId),
  archived: raw.status === "ARCHIVED",
 };
}
export async function getToday(): Promise<TodayData> {
 const raw = await workspace(), day = localToday(), history = historyOf(raw);
 return {
  date: day, companion: companion(raw),
  tasks: raw.tasks.filter(t => dateOnly(t.dueDate) === day).map(t => taskOf(t,day)),
  habits: raw.habits.map(h => habitOf(h,history,day)).filter(h => h.isScheduledToday),
  isCheckInPromptVisible: false,
 };
}
export async function getHabits(): Promise<HabitsData> {
 const raw = await workspace(), history = historyOf(raw);
 return { habits: raw.habits.map(h => habitOf(h,history)) };
}
export async function getHabitTracker(): Promise<HabitTracker> {
 const raw = await workspace(), day = localToday(), history = historyOf(raw);
 const habits = raw.habits.map(h => habitOf(h,history,day));
 return { todayIso: day, habits, history, rhythms: Object.fromEntries(habits.map(h => [h.id,currentRun({
  scheduleDays: h.scheduleDays ?? [0,1,2,3,4,5,6], targetCount: h.targetCount,
  startsOn:h.startsOn, pausedFrom:h.pausedFrom, pausedUntil:h.pausedUntil
 },history[h.id] ?? {},day)])) };
}
export async function getPlanner(): Promise<PlannerData> {
 const raw = await workspace(), day = localToday(), weekStart = new Date(day+"T12:00:00");
 weekStart.setDate(weekStart.getDate() - (weekStart.getDay()+6)%7);
 const days = Array.from({length:7},(_,i) => addDays(isoDate(weekStart),i));
 const weekTasks = Object.fromEntries(days.map((iso,index) => [index,
  raw.tasks.filter(t => dateOnly(t.dueDate) === iso).map(t => ({
   id:t.id,title:t.title,detail:t.dueTime || (t.visibility==="SQUAD"?"Shared":"Task"),
   isDone:taskOf(t,iso).isDone,isShared:t.visibility==="SQUAD",
  }))
 ]));
 const allTasks: PlannerListTask[] = raw.tasks.filter(t => dateOnly(t.dueDate) !== day).map(t => {
  const date = dateOnly(t.dueDate);
  return {
   id:t.id,title:t.title, detail:date ?? "No date",
   group: date && date<day ? "overdue" : date && date<=addDays(day,7) ? "thisWeek" : "later",
   isDone: date ? taskOf(t,date).isDone : false,
   isShared:t.visibility==="SQUAD",hasDate:Boolean(date),
   badge:t.visibility==="SQUAD"?"Shared":t.priority==="HIGH"?"P1":undefined,
  };
 });
 const history = historyOf(raw);
 return {
  carryOver: raw.tasks.filter(t => dateOnly(t.dueDate) && dateOnly(t.dueDate)!<day && !taskOf(t,dateOnly(t.dueDate)!).isDone)
    .sort((a,b) => (b.dueDate ?? "").localeCompare(a.dueDate ?? ""))[0] ? (() => {
      const t = raw.tasks.filter(t => dateOnly(t.dueDate) && dateOnly(t.dueDate)!<day && !taskOf(t,dateOnly(t.dueDate)!).isDone)
        .sort((a,b) => (b.dueDate ?? "").localeCompare(a.dueDate ?? ""))[0];
      return {id:t.id,title:t.title};
    })() : null,
  suggestedActionCount:0, habitsPerDay:raw.habits.filter(h => habitOf(h,history).isScheduledToday).length,
  weekTaskCounts:days.map((_,i) => weekTasks[i].length),weekTasks,
  allTasks,
  goals:raw.goals.map(g=>({id:g.id,title:g.title,doneCount:g.tasks.filter(t=>t.completions.length>0).length,totalCount:g.tasks.length,
    detail:g.squadId?"Shared goal":"Personal goal",isShared:Boolean(g.squadId),isPaused:g.status!=="ACTIVE"})),
  shared:raw.tasks.filter(t=>t.visibility==="SQUAD").map(t=>({id:t.id,title:t.title,assignedBy:t.squad?.name??"Squad",due:dateOnly(t.dueDate)??"Unscheduled"})),
  squadName:raw.squads[0]?.squad.name ?? "your squad",
 };
}
export async function completeTask(taskId: string): Promise<{task:Task;companion:CompanionState;xpAwarded:number}> {
 const day=localToday();
 const response=await request<{xpAwarded:number;stageChanged:boolean}>(`/api/tasks/${encodeURIComponent(taskId)}/complete`,"POST",{occurrenceDate:day});
 if(response.xpAwarded || response.stageChanged) celebrate();
 const raw=await workspace();
 const task=raw.tasks.find(t=>t.id===taskId);
 if(!task)throw new Error("Task no longer accessible");
 return {task:taskOf(task),companion:companion(raw),xpAwarded:response.xpAwarded};
}
export async function undoCompleteTask(taskId:string):Promise<{task:Task;companion:CompanionState}> {
 await request(`/api/tasks/${encodeURIComponent(taskId)}/complete?occurrenceDate=${localToday()}`,"DELETE");
 const raw=await workspace(),task=raw.tasks.find(t=>t.id===taskId);
 if(!task)throw new Error("Task no longer accessible");
 return {task:taskOf(task),companion:companion(raw)};
}
export async function addTask(input:NewTaskInput):Promise<{task:Task}> {
 const day=localToday(); const raw=await workspace();
 const squadId=input.shareWithSquad?raw.squads[0]?.squadId:undefined;
 if(input.shareWithSquad && !squadId)throw new Error("Join a squad before sharing tasks");
 if(input.repeats && input.repeats!=="never")throw new Error("Recurring tasks are not yet available");
 if(input.when==="pickDate"&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(input.selectedDate??""))throw new Error("Choose a valid date");
 const dueDate=input.when==="noDate"?undefined:input.when==="tomorrow"?addDays(day,1):input.when==="pickDate"?input.selectedDate:day;
 const result=await request<{task:RawTask}>("/api/tasks","POST",{
  title:input.title,dueDate,durationMin:input.durationMinutes,
  ...(input.goalId?{goalId:input.goalId}:{}),
  priority:(input.priority??"NONE").toUpperCase(),
  visibility:squadId?"SQUAD":"PRIVATE",...(squadId?{squadId}:{}),
 });
 return {task:taskOf({...result.task,completions:[],goal:null,squad:squadId?{name:raw.squads[0].squad.name}:null})};
}
export async function addHabit(input:NewHabitInput):Promise<{habit:Habit}> {
 const raw=await workspace(),squadId=input.shareWithSquad?raw.squads[0]?.squadId:undefined;
 if(input.shareWithSquad&&!squadId)throw new Error("Join a squad before sharing habits");
 const selectedGoal=input.goalName?raw.goals.find(g=>g.title===input.goalName):undefined;
 const result=await request<{habit:RawHabit}>("/api/habits","POST",{
  name:input.name,targetType:input.kind==="timer"?"DURATION":input.kind==="target"||input.targetCount>1?"COUNT":"CHECK",
  targetValue:input.targetCount,unit:input.unit||undefined,reminderTime:input.reminderTime||undefined,
  scheduleDays:input.scheduleDays??[0,1,2,3,4,5,6],
  ...(selectedGoal?{goalId:selectedGoal.id}:{}),
  ...(input.startsTomorrow?{startsOn:addDays(localToday(),1)}:{}),
  ...(squadId?{sharedWithSquadId:squadId}:{}),
 });
 return {habit:habitOf(result.habit,{})};
}
export async function incrementHabit(habitId:string):Promise<{habit:Habit;companion:CompanionState;moment:ConsistencyMoment|null}> {
 const raw=await workspace(),item=raw.habits.find(h=>h.id===habitId);
 if(!item)throw new Error("Habit no longer accessible");
 const day=localToday(),old=historyOf(raw)[habitId]?.[day]??0;
 // A timer is done in one go: log its full length. Counted habits go up by one.
 const value=item.targetType==="DURATION"?item.targetValue:Math.min(item.targetValue,old+1);
 const awarded = item.status==="ACTIVE" && value!==old ? await request<{xpAwarded:number;moment:ConsistencyMoment|null}>(`/api/habits/${encodeURIComponent(habitId)}/logs/${day}`,"PUT",{value}) : null;
 if(awarded?.xpAwarded) celebrate();
 const next=await workspace();
 const habit=next.habits.find(h=>h.id===habitId);
 if(!habit)throw new Error("Habit no longer accessible");
 return {habit:habitOf(habit,historyOf(next)),companion:companion(next),moment:awarded?.moment ?? null};
}
export interface HabitChanges {scheduleDays?:number[];targetCount?:number}
export async function updateHabit(id:string,changes:HabitChanges):Promise<Habit>{
 await request(`/api/habits/${encodeURIComponent(id)}`,"PATCH",{
  ...(changes.scheduleDays?{scheduleDays:changes.scheduleDays}:{}),
  ...(changes.targetCount?{targetValue:changes.targetCount}:{})
 });
 const raw=await workspace(),h=raw.habits.find(x=>x.id===id);
 if(!h)throw new Error("Habit not found");
 return habitOf(h,historyOf(raw));
}
export async function pauseHabit(id:string,weeks:number|null):Promise<Habit>{
 await request(`/api/habits/${encodeURIComponent(id)}/pause`,"POST",{weeks});
 const raw=await workspace(),h=raw.habits.find(x=>x.id===id);
 if(!h)throw new Error("Habit not found");
 return habitOf(h,historyOf(raw));
}
export async function resumeHabit(id:string):Promise<Habit>{
 await request(`/api/habits/${encodeURIComponent(id)}/resume`,"POST");
 const raw=await workspace(),h=raw.habits.find(x=>x.id===id);
 if(!h)throw new Error("Habit not found");
 return habitOf(h,historyOf(raw));
}
export async function archiveHabit(id:string):Promise<void>{
 await request(`/api/habits/${encodeURIComponent(id)}`,"DELETE");
}
export async function moveListTaskToToday(id:string):Promise<{task:Task|null;planner:PlannerData}>{
 await request(`/api/tasks/${encodeURIComponent(id)}`,"PATCH",{dueDate:localToday()});
 const raw=await workspace(),t=raw.tasks.find(t=>t.id===id);
 return {task:t?taskOf(t):null,planner:await getPlanner()};
}
export async function moveCarryOverToToday():Promise<{task:Task|null;planner:PlannerData}>{
 const plan=await getPlanner();
 return plan.carryOver?moveListTaskToToday(plan.carryOver.id):{task:null,planner:plan};
}
export async function rescheduleCarryOver():Promise<PlannerData>{
 const plan=await getPlanner();
 if(plan.carryOver)await request(`/api/tasks/${encodeURIComponent(plan.carryOver.id)}`,"PATCH",{dueDate:null});
 return getPlanner();
}

export async function createGoal(title: string, shared = false): Promise<void> {
 const raw = await workspace();
 const squadId = shared ? raw.squads[0]?.squadId : undefined;
 if (shared && !squadId) throw new Error("Join a squad before sharing goals");
 await request("/api/goals", "POST", { title: title.trim(), ...(squadId ? { squadId } : {}) });
}

/** Live stage celebrations are private and require acknowledgement by event ID. */
export async function getPendingStageUp() {
 return request<import("../mocks/types").StageUpEvent | null>("/api/xp/stage-up");
}
export async function acknowledgeStageUp(eventId: string): Promise<void> {
 await request("/api/xp/stage-up", "POST", {eventId});
}

// ---------------------------------------------------------------- focus

/** Tell the server a round started, so its length can be checked when it ends. */
export async function startFocusSession(sessionKey: string, input: { plannedMinutes: number; mode: "solo" | "squad"; taskId: string | null }): Promise<void> {
 await request("/api/focus/sessions", "POST", { sessionKey, ...input });
}
export async function saveFocusSession(sessionKey: string, input: import("../mocks/types").SaveFocusInput): Promise<import("../mocks/types").SaveFocusResult> {
 const result = await request<{ focusedSeconds: number; xpAwarded: number; weekFocusedMinutes: number; companion: CompanionState | null }>(
  `/api/focus/sessions/${encodeURIComponent(sessionKey)}/finish`, "POST",
  { focusedSeconds: Math.max(0, Math.floor(input.focusedSeconds)), plannedMinutes: input.plannedMinutes, mode: input.mode, taskId: input.taskId, stopReason: input.stopReason ?? null },
 );
 if (result.xpAwarded > 0) celebrate();
 return { ...result, companion: result.companion ?? { stage: "child", xp: 0, xpToNextStage: 400 } };
}
export async function quoteFocusXp(focusedSeconds: number): Promise<number> {
 const result = await request<{ xp: number }>(`/api/focus/quote?seconds=${Math.max(0, Math.min(10800, Math.floor(focusedSeconds)))}`);
 return result.xp;
}

// ---------------------------------------------------------------- progress, check-ins, achievements

type Achievement = import("../mocks/types").Achievement;

export async function getCheckInStatus(): Promise<import("../mocks/types").CheckInStatus> {
 return request("/api/check-in");
}
export async function saveCheckIn(input: import("../mocks/types").CheckInInput): Promise<{ xpAwarded: number; companion: CompanionState }> {
 const result = await request<{ xpAwarded: number; companion: CompanionState | null }>("/api/check-in", "PUT", input);
 if (result.xpAwarded > 0) celebrate();
 return { xpAwarded: result.xpAwarded, companion: result.companion ?? { stage: "child", xp: 0, xpToNextStage: 400 } };
}
export async function getProgress(fromIso: string, toIso: string): Promise<import("../mocks/types").ProgressSummary> {
 return request(`/api/progress?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`);
}
export async function getGoalSnapshot(goalId: string): Promise<import("../mocks/types").GoalSnapshot | null> {
 if (!/^[a-zA-Z0-9_-]{1,128}$/.test(goalId)) return null;
 try { return await request(`/api/goals/${encodeURIComponent(goalId)}/snapshot`); }
 catch { return null; }
}
export async function getAchievements(): Promise<Achievement[]> {
 return (await request<{ achievements: Achievement[] }>("/api/achievements")).achievements;
}
export async function getAchievement(id: string): Promise<Achievement | null> {
 if (!/^[a-z0-9-]{1,64}$/.test(id)) return null;
 try { return (await request<{ achievement: Achievement }>(`/api/achievements/${id}`)).achievement; }
 catch { return null; }
}
export async function setAchievementShared(id: string, isShared: boolean): Promise<Achievement | null> {
 return (await request<{ achievement: Achievement | null }>(`/api/achievements/${encodeURIComponent(id)}`, "PATCH", { isShared })).achievement;
}
export async function getPendingAchievement(): Promise<Achievement | null> {
 return (await request<{ achievement: Achievement | null }>("/api/achievements/pending")).achievement;
}
export async function acknowledgeAchievement(achievementId: string): Promise<void> {
 await request("/api/achievements/pending", "POST", { achievementId });
}
