"use client";

import { ApiError, request } from "../api/liveRepository";
import type { AcceptHabitOptions, BusyBlock, GridAction, GrowthStudioState, Quadrant, ReviewChange, ReviewState, SchedulerItem, SlotCheck } from "../mocks/types";

/** A save that failed for reasons outside the person's control (network, server). Drafts are kept. */
export class SaveFailedError extends Error {
  constructor() {
    super("Couldn’t save just now.");
    this.name = "SaveFailedError";
  }
}

let failNext = false;

/** Design-review hook for the shared "couldn't save" state: the next Studio save fails once, before any request. */
export function simulateStudioSaveFailure(): void {
  failNext = true;
}

/** Validation messages pass through; network and server failures become SaveFailedError. */
async function save<T>(path: string, method: string, body?: unknown): Promise<T> {
  if (failNext) {
    failNext = false;
    throw new SaveFailedError();
  }
  try {
    return await request<T>(path, method, body);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status === 0 || error.status >= 500) throw new SaveFailedError();
    throw error;
  }
}

const id = (value: string) => encodeURIComponent(value);

export const getGrowthStudio = () => request<GrowthStudioState>("/api/growth");
/** Design-review preview of a grid whose goal is gone. It only changes what this screen shows. */
export async function previewOrphanGrid(): Promise<GrowthStudioState> {
  const state = await getGrowthStudio();
  return state.grid ? { ...state, grid: { ...state.grid, goalId: "", goalTitle: "" } } : state;
}
export const rateArea = (areaId: string, rating: number | null, note: string) => save<GrowthStudioState>(`/api/growth/areas/${id(areaId)}/rating`, "PUT", { rating, note });
export const saveAuditAreas = (areas: { id: string | null; name: string }[]) => save<GrowthStudioState>("/api/growth/areas", "PUT", { areas });
export const answerQuestion = (questionId: string, answer: string) => save<GrowthStudioState>(`/api/growth/questions/${id(questionId)}`, "PUT", { answer });
export const setCentralGoal = (input: { goalId: string | null; newTitle?: string; why: string; keepGrid?: boolean }) => save<GrowthStudioState>("/api/growth/central-goal", "PUT", input);
export const applySuggestedGrid = (blank: boolean) => save<GrowthStudioState>("/api/growth/grid/suggested", "POST", { blank });
export const renameGridArea = (areaId: string, name: string) => save<GrowthStudioState>(`/api/growth/grid/areas/${id(areaId)}`, "PATCH", { name });
export const saveGridAction = (input: Omit<GridAction, "id" | "status" | "rhythmChangedByYou"> & { id: string | null }) =>
  save<{ state: GrowthStudioState; actionId: string }>("/api/growth/grid/actions", "PUT", input);
export const setActionRhythm = (actionId: string, rhythm: GridAction["rhythm"]) => save<GrowthStudioState>(`/api/growth/grid/actions/${id(actionId)}/rhythm`, "PATCH", { rhythm });
export const acceptGridAction = (actionId: string, as: "task" | "habit", habit?: AcceptHabitOptions) =>
  save<GrowthStudioState>(`/api/growth/grid/actions/${id(actionId)}/accept`, "POST", habit ? { as, habit } : { as });
export const acceptAllRhythms = () => save<GrowthStudioState>("/api/growth/grid/accept-all", "POST");

export const getScheduler = () => request<{ items: SchedulerItem[]; drafts: { id: string; title: string; area: string }[] }>("/api/growth/scheduler");
export const setQuadrant = (taskId: string, quadrant: Quadrant) => request<SchedulerItem>(`/api/growth/scheduler/${id(taskId)}/quadrant`, "PATCH", { quadrant });
export const getBusy = (dateIso: string, taskId: string | null) =>
  request<BusyBlock[]>(`/api/growth/scheduler/busy?date=${id(dateIso)}${taskId ? `&taskId=${id(taskId)}` : ""}`);
export const getBusyDays = (year: number, month: number) => request<string[]>(`/api/growth/scheduler/busy-days?year=${year}&month=${month}`);
export const checkSlot = (taskId: string, dateIso: string, time: string) =>
  request<SlotCheck>(`/api/growth/scheduler/${id(taskId)}/slot?date=${id(dateIso)}&time=${id(time.slice(0, 5))}`);
export const scheduleTask = (taskId: string, input: { date: string; time: string; repeatsDaily: boolean }) =>
  request<SchedulerItem>(`/api/growth/scheduler/${id(taskId)}/schedule`, "POST", input);

export const OBSTACLES = ["Time", "Energy", "Unclear next step", "Motivation", "Health", "Something else"];
export const getReview = () => request<ReviewState>("/api/growth/review");
export const saveReview = (input: { obstacles: string[]; context: string; changes: ReviewChange[]; finish: boolean }) => request<ReviewState>("/api/growth/review", "PUT", input);
