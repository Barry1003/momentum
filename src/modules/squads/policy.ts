export type SquadRole = "OWNER" | "ADMIN" | "MEMBER";

export class SquadError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
    this.name = "SquadError";
  }
}

export function canManageSquad(role: SquadRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}
export function canManageMember(actor: SquadRole, target: SquadRole): boolean {
  return actor === "OWNER" && target !== "OWNER" || actor === "ADMIN" && target === "MEMBER";
}
export function mayLeave(role: SquadRole): boolean {
  return role !== "OWNER";
}
export function mayJoin(uses: number, maxUses: number, activeMembers: number, maxMembers: number): string | null {
  if (uses >= maxUses) return "INVITATION_EXHAUSTED";
  if (activeMembers >= maxMembers) return "SQUAD_FULL";
  return null;
}
