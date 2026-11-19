"use client";

/** Thin client for the real squad endpoints. The server validates and authorizes every call. */

export class SquadApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string } | string } | null)?.error;
    const code = typeof error === "object" && error?.code ? error.code : "ERROR";
    const message = typeof error === "string" ? error : error?.message;
    throw new SquadApiError(response.status, code, message || "Something went wrong. Please try again.");
  }
  return payload as T;
}

export interface MySquad {
  id: string;
  name: string;
  description: string | null;
  maxMembers: number;
  ownerId: string;
  memberCount: number;
  createdAt: string;
}

export interface SquadMemberInfo {
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  name: string;
}

export interface InvitationInfo {
  id: string;
  status: string;
  uses: number;
  maxUses: number;
  expiresAt: string;
}

export interface InvitationPreview {
  squadName: string;
  memberCount: number;
  full: boolean;
  available: boolean;
}

interface RawMember {
  userId: string;
  role: SquadMemberInfo["role"];
  joinedAt: string;
  user: { name: string; profile: { displayName: string } | null };
}

const path = (id: string) => `/api/squads/${encodeURIComponent(id)}`;

/** Pulls the invite code out of a pasted code or invite link. */
export function parseInviteCode(input: string): string {
  const value = input.trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.searchParams.get("code") ?? url.pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return value;
  }
}

export const squadApi = {
  myId: () => call<{ user: { id: string } }>("/api/me").then((result) => result.user.id),
  list: () => call<{ squads: MySquad[] }>("/api/squads").then((result) => result.squads),
  create: (input: { name: string; description?: string; maxMembers: number }) =>
    call<{ squad: MySquad }>("/api/squads", { method: "POST", body: JSON.stringify(input) }).then((result) => result.squad),
  members: (id: string) =>
    call<{ members: RawMember[] }>(`${path(id)}/members`).then((result) =>
      result.members.map((member) => ({
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        name: member.user.profile?.displayName || member.user.name,
      })),
    ),
  invite: (id: string, maxUses: number) =>
    call<{ invitation: { id: string; expiresAt: string; maxUses: number; code: string } }>(`${path(id)}/invitations`, {
      method: "POST",
      body: JSON.stringify({ expiresHours: 168, maxUses: Math.min(10, Math.max(1, maxUses)) }),
    }).then((result) => result.invitation),
  invitations: (id: string) => call<{ invitations: InvitationInfo[] }>(`${path(id)}/invitations`).then((result) => result.invitations),
  closeInvitation: (invitationId: string) => call<{ closed: boolean }>(`/api/invitations/${encodeURIComponent(invitationId)}`, { method: "DELETE" }),
  preview: (code: string) => call<{ invitation: InvitationPreview }>(`/api/invitations/${encodeURIComponent(code)}`).then((result) => result.invitation),
  accept: (code: string) => call<{ squadId: string; joined: boolean }>(`/api/invitations/${encodeURIComponent(code)}/accept`, { method: "POST" }),
  leave: (id: string) => call<unknown>(`${path(id)}/leave`, { method: "POST" }),
  transfer: (id: string, userId: string) => call<unknown>(`${path(id)}/transfer-ownership`, { method: "POST", body: JSON.stringify({ userId }) }),
};
