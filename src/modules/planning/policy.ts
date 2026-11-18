export function canEditGoal(ownerId: string, userId: string, memberRole: "EDITOR" | "VIEWER" | null) {
  return ownerId === userId || memberRole === "EDITOR";
}

export function canReadTask(ownerId: string, actorId: string, visibility: "PRIVATE" | "SQUAD", isActiveMember: boolean) {
  return ownerId === actorId || visibility === "SQUAD" && isActiveMember;
}

export function canCompleteTask(ownerId: string, assigneeId: string | null, actorId: string) {
  return (assigneeId ?? ownerId) === actorId;
}

export function validTaskScope(visibility: "PRIVATE" | "SQUAD", squadId: string | null) {
  return visibility !== "SQUAD" || squadId !== null;
}
