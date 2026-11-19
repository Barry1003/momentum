"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import malikFace from "../assets/faces/malik-face.png";
import malikFull from "../assets/faces/malik-full.png";
import zaraFace from "../assets/faces/zara-face.png";
import zaraFull from "../assets/faces/zara-full.png";
import { STAGE_ART, type GrowthStage } from "../companion";
import { FaceAvatar, ProgressBar, Skeleton } from "../components";
import { AriTile } from "../habits/views";
import { useShell } from "../home/AppShell";
import { CheckIcon, PlusIcon, SparkleIcon } from "../home/icons";
import { useToday } from "../hooks";
import { cn } from "../lib/cn";
import { MenuRow } from "../me/MeScreen";
import { Choice, ErrorLine, Note, Primary, Secondary, ToggleRow, errorText } from "../me/SettingsScreen";
import {
  CHEERS,
  REPORT_REASONS,
  getMemberShare,
  sendCheer,
  type MemberShare,
  getSharedGoal,
  joinSharedGoal,
  leaveSharedGoal,
  submitSquadReport,
  type SharedGoalPreview,
} from "../mocks/repository";
import type { PrivacySettings, ReminderSettings } from "../mocks/types";
import { Badge, Panel, Pill, SubHeader } from "../planner/parts";
import { getPrivacy, getReminders, savePrivacy, saveReminders } from "../api/liveRepository";
import { SquadApiError, parseInviteCode, squadApi, type InvitationInfo, type InvitationPreview, type MySquad, type SquadMemberInfo } from "./api";

type View =
  | "find"
  | "create"
  | "ready"
  | "join"
  | "joined"
  | "members"
  | "goal"
  | "goalProgress"
  | "settings"
  | "invites"
  | "leave"
  | "cantLeave"
  | "transfer"
  | "report"
  | "reportSent"
  | "member";

const VIEWS: View[] = ["find", "create", "ready", "join", "joined", "members", "goal", "goalProgress", "settings", "invites", "leave", "cantLeave", "transfer", "report", "reportSent", "member"];
/** Views that only make sense once you are in a squad. */
const NEEDS_SQUAD: View[] = ["ready", "joined", "members", "goal", "goalProgress", "settings", "invites", "leave", "cantLeave", "transfer", "report", "reportSent", "member"];

export const squadHref = (view: View, extra = "") => `/squad?view=${view}${extra}`;

const FACES: Record<string, typeof zaraFace> = { Zara: zaraFace, Malik: malikFace };
const FULLS: Record<string, typeof zaraFull> = { Zara: zaraFull, Malik: malikFull };
const NAME_MAX = 30;

interface Invite {
  code: string;
  expiresAt: string;
}

type Loaded =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; myId: string; squad: MySquad | null; members: SquadMemberInfo[] };

function shortDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function inviteLink(code: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/squad?view=join&code=${encodeURIComponent(code)}`;
}

function isOpen(item: InvitationInfo): boolean {
  return item.status === "OPEN" && new Date(item.expiresAt).getTime() > Date.now();
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function useMySquad(version: number): Loaded {
  const [state, setState] = useState<Loaded>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [myId, squads] = await Promise.all([squadApi.myId(), squadApi.list()]);
        const squad = squads[0] ?? null;
        const members = squad ? await squadApi.members(squad.id) : [];
        if (alive) setState({ status: "ready", myId, squad, members });
      } catch (err) {
        if (alive) setState({ status: "error", message: errorText(err, "We couldn’t load your squad.") });
      }
    })();
    return () => {
      alive = false;
    };
  }, [version]);
  return state;
}

// ------------------------------------------------------------------ small parts

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className={className}>
      <path d="M6 20V12M12 20V5M18 20v-6" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z" />
    </svg>
  );
}

function Column({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5">{children}</div>;
}

/** Purple orb that shows a fixed yes/no, used for "what they would see" lists. */
function StaticCheck({ on, title, detail }: { on: boolean; title: string; detail?: string }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span aria-hidden className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", on ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : "bg-accent-tint shadow-inset")}>
        {on ? <CheckIcon className="h-4 w-4" /> : null}
      </span>
      <span>
        <span className="block font-heading text-body font-bold text-text">
          {title}
          <span className="sr-only">{on ? " (yes)" : " (no)"}</span>
        </span>
        {detail ? <span className="block font-heading text-meta text-text-muted">{detail}</span> : null}
      </span>
    </li>
  );
}

function MemberFace({ name, isMe, stage, size = 44 }: { name: string; isMe: boolean; stage: GrowthStage; size?: number }) {
  if (isMe) return <FaceAvatar name={name} src={STAGE_ART[stage].face} size={size} />;
  return <FaceAvatar name={name} src={FACES[name]} size={size} />;
}

function Divided({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-[#ece6f6]">{children}</ul>;
}

function InviteTile({ code, art, onCopy }: { code: string; art: (typeof STAGE_ART)["teen"]["full"]; onCopy: () => void }) {
  return (
    <section className="flex items-stretch overflow-hidden rounded-[26px] bg-[#f8f0e2] shadow-floating">
      <div className="flex min-w-0 flex-1 flex-col justify-center p-5">
        <p className="font-heading text-meta tracking-wide text-accent-strong uppercase">Your invite code</p>
        <p className="mt-2 font-heading text-body font-extrabold break-all text-text">{code}</p>
        <p className="mt-2 font-heading text-label text-text-muted">Expires in 7 days. You can close invites anytime.</p>
        <button type="button" onClick={onCopy} className="mt-3 self-start rounded-full bg-surface px-4 py-2 font-heading text-label font-bold text-text shadow-raised">
          Copy code
        </button>
      </div>
      <div className="relative w-[96px] shrink-0 bg-[#f1e8da] sm:w-[120px]">
        <Image src={art} alt="Ari" fill sizes="120px" className="object-contain object-bottom" />
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ screen

/** Figma 02b · Squad · Join & invite and 02c · Squad · Together & settings. */
export function SquadScreen() {
  const params = useSearchParams();
  const raw = params.get("view");
  const requested: View = VIEWS.includes(raw as View) ? (raw as View) : "members";
  const [version, setVersion] = useState(0);
  const loaded = useMySquad(version);
  const [invite, setInvite] = useState<Invite | null>(null);
  const reload = () => setVersion((value) => value + 1);
  const today = useToday();
  const stage: GrowthStage = today.data?.companion?.stage ?? "teen";

  let body: ReactNode;
  if (loaded.status === "loading") {
    body = (
      <Column>
        <Skeleton className="h-16 w-2/3 rounded-[20px]" />
        <Skeleton className="h-40 w-full rounded-[26px]" />
        <Skeleton className="h-52 w-full rounded-[26px]" />
      </Column>
    );
  } else if (loaded.status === "error") {
    body = (
      <Column>
        <SubHeader backHref="/home" backLabel="Back home" kicker="Squad" title="Squad couldn’t load." subtitle="Your own progress is safe." />
        <Note tone="warm" title="Something went wrong">
          {loaded.message}
        </Note>
        <Primary onClick={reload}>Try again</Primary>
      </Column>
    );
  } else {
    const { squad, members, myId } = loaded;
    // Without a squad, squad-only views fall back to Find your circle.
    const view: View = !squad && NEEDS_SQUAD.includes(requested) ? "find" : requested;
    const context = { squad, members, myId, reload, invite, setInvite, stage };
    switch (view) {
      case "find":
        body = <FindView squad={squad} stage={stage} />;
        break;
      case "create":
        body = <CreateView {...context} />;
        break;
      case "join":
        body = <JoinView squad={squad} reload={reload} />;
        break;
      default:
        body = squad ? <SquadViews view={view} {...context} squad={squad} /> : null;
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pt-7 pb-36 sm:px-8 md:pt-10 md:pb-16">
      {body}
      <p role="status" className="mx-auto mt-6 max-w-[560px] font-heading text-meta text-text-muted">
        Preview: shared goals, reports, cheers, waves and muting here are examples. Creating, inviting, joining, leaving, handing over a squad and your sharing switches are real.
      </p>
    </main>
  );
}

interface Context {
  squad: MySquad | null;
  members: SquadMemberInfo[];
  myId: string;
  reload: () => void;
  invite: Invite | null;
  setInvite: (invite: Invite | null) => void;
  stage: GrowthStage;
}

// ------------------------------------------------------------------ 02b · join & invite

function FindView({ squad, stage }: { squad: MySquad | null; stage: GrowthStage }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const art = STAGE_ART[stage].full;

  const join = () => {
    const parsed = parseInviteCode(code);
    if (!parsed) {
      setError("Paste the code or link from your invite.");
      return;
    }
    router.push(squadHref("join", `&code=${encodeURIComponent(parsed)}`));
  };

  return (
    <Column>
      <SubHeader backHref="/home" backLabel="Back home" kicker="Squad" title="Find your circle." subtitle="A small group of up to 8 who grow alongside you." />
      {squad ? (
        <Note title={`You’re already in ${squad.name}`}>
          <Link href={squadHref("members")} className="font-bold text-accent-strong">
            Open {squad.name}
          </Link>
        </Note>
      ) : null}
      <AriTile art={art} label="Squads are optional" title="Grow together, privately." body="Your squad only sees what you choose to share." />
      <Panel title="How do you want to start?">
        <Divided>
          <MenuRow href={squadHref("create")} icon={<PlusIcon className="h-5 w-5" />} title="Create a squad" detail="Name it, then invite friends" />
          <MenuRow onClick={() => document.getElementById("invite-code")?.focus()} icon={<PersonIcon className="h-5 w-5" />} title="Join with a code" detail="Got an invite? Enter it here" />
        </Divided>
      </Panel>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          join();
        }}
      >
        <label htmlFor="invite-code" className="mb-2 block font-heading text-body font-bold text-text">
          Invite code
        </label>
        <span className="flex items-center gap-3 rounded-[22px] bg-surface px-5 py-3.5 shadow-raised focus-within:outline focus-within:outline-2 focus-within:outline-accent">
          <input
            id="invite-code"
            value={code}
            maxLength={512}
            autoComplete="off"
            placeholder="Paste your code or invite link"
            onChange={(event) => {
              setError(null);
              setCode(event.target.value);
            }}
            className="min-w-0 flex-1 bg-transparent font-heading text-body text-text outline-none placeholder:text-text-muted"
          />
          <button type="submit" className="shrink-0 font-heading text-label font-bold text-accent-strong">
            Join
          </button>
        </span>
        <div className="mt-2">
          <ErrorLine message={error} />
        </div>
      </form>
      <Note>Leaving is always possible. Your own progress stays yours.</Note>
    </Column>
  );
}

function CreateView({ squad, setInvite, reload }: Context) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [size, setSize] = useState<"4" | "6" | "8">("8");
  const [defaults, setDefaults] = useState({ checkedIn: true, focus: true, sharedGoal: false });
  const [invalid, setInvalid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const create = async () => {
    if (trimmed.length < 2 || trimmed.length > NAME_MAX) {
      setInvalid(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await squadApi.create({ name: trimmed, description: purpose.trim() || undefined, maxMembers: Number(size) });
      const invitation = await squadApi.invite(created.id, created.maxMembers - 1);
      setInvite({ code: invitation.code, expiresAt: invitation.expiresAt });
      reload();
      router.push(squadHref("ready"));
    } catch (err) {
      setError(errorText(err, "We couldn’t create the squad. Nothing was saved."));
      setSaving(false);
    }
  };

  return (
    <Column>
      <SubHeader
        backHref={squadHref("find")}
        backLabel="Back"
        kicker="Squad · Create"
        title={invalid ? "Almost there." : "Create a squad."}
        subtitle={invalid ? "One thing needs a fix." : "You can change all of this later."}
      />
      {squad ? <Note title={`You’re already in ${squad.name}`}>A new squad would be a second circle. You can still create one.</Note> : null}
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <label className="block">
          <span className="mb-2 block font-heading text-body font-bold text-text">Squad name</span>
          <span
            className={cn(
              "flex items-center gap-3 rounded-[22px] bg-surface px-5 py-3.5 shadow-raised outline-2",
              invalid ? "outline outline-warning" : "focus-within:outline focus-within:outline-accent",
            )}
          >
            <input
              value={name}
              maxLength={NAME_MAX}
              aria-invalid={invalid}
              aria-describedby={invalid ? "name-error" : undefined}
              onChange={(event) => {
                setInvalid(false);
                setName(event.target.value);
              }}
              className="min-w-0 flex-1 bg-transparent font-heading text-body text-text outline-none"
            />
            {!invalid ? (
              <span className="shrink-0 font-heading text-meta font-bold text-accent-strong">
                {name.length} / {NAME_MAX}
              </span>
            ) : null}
          </span>
          {invalid ? (
            <span id="name-error" role="alert" className="mt-2 block font-heading text-label text-warning">
              Give your squad a name (2–{NAME_MAX} characters).
            </span>
          ) : null}
        </label>
        <label className="block">
          <span className="mb-2 block font-heading text-body font-bold text-text">What are you working toward? · optional</span>
          <span className="flex items-center rounded-[22px] bg-surface px-5 py-3.5 shadow-raised focus-within:outline focus-within:outline-2 focus-within:outline-accent">
            <input value={purpose} maxLength={500} onChange={(event) => setPurpose(event.target.value)} className="min-w-0 flex-1 bg-transparent font-heading text-body text-text outline-none" />
          </span>
        </label>
        {invalid ? (
          <Note tone="warm" title="Nothing was created yet">
            Your other choices are kept.
          </Note>
        ) : (
          <>
            <Choice
              legend="Squad size"
              value={size}
              onChange={setSize}
              options={[
                { value: "4", label: "Up to 4" },
                { value: "6", label: "Up to 6" },
                { value: "8", label: "Up to 8" },
              ]}
            />
            <Panel title="Defaults for new members">
              <ul className="divide-y divide-[#ece6f6]">
                <ToggleRow title="Show “checked in today”" detail="Members can turn this off" checked={defaults.checkedIn} onChange={(checkedIn) => setDefaults({ ...defaults, checkedIn })} />
                <ToggleRow title="Show focus status" detail="Only while focusing" checked={defaults.focus} onChange={(focus) => setDefaults({ ...defaults, focus })} />
                <ToggleRow title="Shared goal" detail="Opt-in per member" checked={defaults.sharedGoal} onChange={(sharedGoal) => setDefaults({ ...defaults, sharedGoal })} />
              </ul>
            </Panel>
          </>
        )}
        <ErrorLine message={error} />
        <Primary type="submit" disabled={saving}>
          {saving ? "Creating…" : invalid || !trimmed ? "Create squad" : `Create ${trimmed}`}
        </Primary>
      </form>
    </Column>
  );
}

function JoinView({ squad, reload }: { squad: MySquad | null; reload: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [failed, setFailed] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!code) return;
    void squadApi
      .preview(code)
      .then((result) => {
        if (alive) setPreview(result);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [code]);

  if (!code || failed || (preview && !preview.available)) return <UnavailableView preview={preview} />;
  if (!preview) {
    return (
      <Column>
        <Skeleton className="h-16 w-2/3 rounded-[20px]" />
        <Skeleton className="h-52 w-full rounded-[26px]" />
      </Column>
    );
  }

  const join = async () => {
    setJoining(true);
    setError(null);
    try {
      await squadApi.accept(code);
      reload();
      router.push(squadHref("joined"));
    } catch (err) {
      setError(errorText(err, "We couldn’t add you. Please try again."));
      setJoining(false);
    }
  };

  return (
    <Column>
      <SubHeader backHref={squadHref("find")} backLabel="Back" kicker="Invitation" title={`You’re invited to ${preview.squadName}.`} subtitle={`${preview.memberCount} ${preview.memberCount === 1 ? "member" : "members"}`} />
      {squad ? <Note title={`You’re already in ${squad.name}`}>Joining adds a second circle. Your current squad stays as it is.</Note> : null}
      <Panel title={`What ${preview.squadName} would see`}>
        <ul className="divide-y divide-[#ece6f6]">
          <StaticCheck on title="That you checked in today" />
          <StaticCheck on title="When you’re focusing" />
          <StaticCheck on={false} title="Your tasks, notes and reflections" detail="Never shared" />
        </ul>
      </Panel>
      <ErrorLine message={error} />
      <Primary onClick={() => void join()} disabled={joining}>
        {joining ? "Joining…" : `Join ${preview.squadName}`}
      </Primary>
      <Secondary to="/home">Not now</Secondary>
    </Column>
  );
}

function UnavailableView({ preview }: { preview: InvitationPreview | null }) {
  const router = useRouter();
  const name = preview?.squadName;
  return (
    <Column>
      <SubHeader
        backHref={squadHref("find")}
        backLabel="Back"
        kicker="Invitation"
        title="This invite can’t be used."
        subtitle={name ? `${name} is full, or the invite was closed.` : "The squad may be full, or the invite was closed or expired."}
      />
      <Note tone="warm" title={preview?.full && name ? `${name} has ${preview.memberCount} of ${preview.memberCount} members` : "This invite isn’t open"}>
        Ask for a new invite when a spot opens, or start your own squad.
      </Note>
      <Primary onClick={() => router.push(squadHref("create"))}>Create my own squad</Primary>
      <Secondary to={squadHref("find")}>Enter another code</Secondary>
      <Note>Momentum works fully on your own, too.</Note>
    </Column>
  );
}

// ------------------------------------------------------------------ squad-only views

function SquadViews({ view, ...context }: Context & { view: View; squad: MySquad }) {
  switch (view) {
    case "ready":
      return <ReadyView {...context} />;
    case "joined":
      return <JoinedView {...context} />;
    case "goal":
    case "goalProgress":
      return <SharedGoalView {...context} />;
    case "settings":
      return <SettingsView {...context} />;
    case "invites":
      return <InvitesView {...context} />;
    case "leave":
      return <LeaveView {...context} />;
    case "cantLeave":
      return <CantLeaveView {...context} />;
    case "transfer":
      return <TransferView {...context} />;
    case "report":
    case "reportSent":
      return <ReportView view={view} {...context} />;
    case "member":
      return <MemberView {...context} />;
    default:
      return <MembersView {...context} />;
  }
}

function roleOf(members: SquadMemberInfo[], myId: string) {
  return members.find((member) => member.userId === myId)?.role ?? "MEMBER";
}

function useNewInvite({ squad, setInvite }: Context & { squad: MySquad }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const invitation = await squadApi.invite(squad.id, squad.maxMembers - squad.memberCount);
      setInvite({ code: invitation.code, expiresAt: invitation.expiresAt });
      router.push(squadHref("ready"));
    } catch (err) {
      setError(errorText(err, "We couldn’t make an invite."));
    } finally {
      setBusy(false);
    }
  };
  return { create, error, busy };
}

function ReadyView(context: Context & { squad: MySquad }) {
  const { squad, invite, stage } = context;
  const router = useRouter();
  const { showToast } = useShell();
  const newInvite = useNewInvite(context);
  const spots = Math.max(0, squad.maxMembers - squad.memberCount);

  const copy = async (text: string, what: string) => {
    showToast((await copyText(text)) ? `${what} copied` : "Couldn’t copy. Select it and copy instead.");
  };
  const share = async (code: string) => {
    const url = inviteLink(code);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `Join ${squad.name} on Momentum`, url });
        return;
      } catch {
        return;
      }
    }
    await copy(url, "Invite link");
  };

  return (
    <Column>
      <SubHeader backHref={squadHref("members")} backLabel="Back" kicker={`Squad · ${squad.name}`} title={`${squad.name} is ready.`} subtitle={`Invite up to ${spots} ${spots === 1 ? "person" : "people"}.`} />
      {invite ? (
        <>
          <InviteTile code={invite.code} art={STAGE_ART[stage].full} onCopy={() => void copy(invite.code, "Code")} />
          <Panel title="Share">
            <Divided>
              <MenuRow onClick={() => void copy(inviteLink(invite.code), "Invite link")} icon={<SparkleIcon className="h-5 w-5" />} title="Copy invite link" detail="Anyone with it can ask to join" />
              <MenuRow onClick={() => void share(invite.code)} icon={<PersonIcon className="h-5 w-5" />} title="Share via apps" detail="WhatsApp, Messages, email" />
            </Divided>
          </Panel>
        </>
      ) : (
        <>
          <Note title="Invite codes are shown once">Make a fresh invite to share. Older invites keep working until they expire.</Note>
          <ErrorLine message={newInvite.error} />
          <Primary onClick={() => void newInvite.create()} disabled={newInvite.busy || spots === 0}>
            {spots === 0 ? `${squad.name} is full` : newInvite.busy ? "Making an invite…" : "Make an invite"}
          </Primary>
        </>
      )}
      <Primary onClick={() => router.push("/home?tab=squad")}>Go to Squad Room</Primary>
      <Secondary to={squadHref("members")}>Invite later</Secondary>
    </Column>
  );
}

function JoinedView({ squad, members, myId, stage }: Context & { squad: MySquad }) {
  const router = useRouter();
  const { showToast } = useShell();
  const others = members.filter((member) => member.userId !== myId).slice(0, 3);
  return (
    <Column>
      <SubHeader backHref="/home" backLabel="Back home" kicker="Squad · Welcome" title={`You’re in ${squad.name}!`} subtitle="Ari has a spot in the room now." />
      <AriTile art={STAGE_ART[stage].full} label="Welcome" title="Say hi to your squad." body="A small wave goes a long way." />
      {others.length > 0 ? (
        <Panel title="Here now">
          <Divided>
            {others.map((member) => (
              <li key={member.userId} className="flex items-center gap-3 py-3">
                <MemberFace name={member.name} isMe={false} stage={stage} />
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-body font-bold text-text">{member.name}</span>
                  <span className="block font-heading text-meta text-text-muted">{member.role === "OWNER" ? "Owner" : `Joined ${shortDate(member.joinedAt)}`}</span>
                </span>
                <button type="button" onClick={() => showToast(`Wave sent to ${member.name} (preview)`)} className="rounded-full bg-accent-tint px-3 py-1.5 font-heading text-meta font-bold text-accent-strong">
                  Wave
                </button>
              </li>
            ))}
          </Divided>
        </Panel>
      ) : null}
      <Primary onClick={() => router.push("/home?tab=squad")}>Open Squad Room</Primary>
      <Secondary to={squadHref("settings")}>Review what I share</Secondary>
    </Column>
  );
}

function MembersView(context: Context & { squad: MySquad }) {
  const { squad, members, myId, stage } = context;
  const role = roleOf(members, myId);
  const newInvite = useNewInvite(context);
  const canInvite = role !== "MEMBER";
  return (
    <Column>
      <SubHeader backHref="/home?tab=squad" backLabel="Back to Squad Room" kicker={`${squad.name} · Members`} title={`${squad.name} · ${members.length} ${members.length === 1 ? "member" : "members"}`} subtitle="Tap someone to see what they share or send a cheer." />
      <Panel>
        <Divided>
          {members.map((member) => {
            const isMe = member.userId === myId;
            return (
              <li key={member.userId}>
                <Link href={isMe ? "/me" : squadHref("member", `&id=${encodeURIComponent(member.userId)}`)} className="flex items-center gap-3 py-3">
                  <MemberFace name={member.name} isMe={isMe} stage={stage} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-body font-bold text-text">
                      {member.name}
                      {isMe ? " (you)" : ""}
                    </span>
                    <span className="block font-heading text-meta text-text-muted">
                      {member.role === "OWNER" ? "Owner" : member.role === "ADMIN" ? "Admin" : "Member"} · joined {shortDate(member.joinedAt)}
                    </span>
                  </span>
                  {member.role === "OWNER" ? <Badge>Owner</Badge> : null}
                </Link>
              </li>
            );
          })}
        </Divided>
      </Panel>
      <Link href={squadHref("goal")} className="font-heading text-label font-bold text-accent-strong">
        Shared goal →
      </Link>
      <ErrorLine message={newInvite.error} />
      {canInvite ? (
        <Primary onClick={() => void newInvite.create()} disabled={newInvite.busy || squad.memberCount >= squad.maxMembers}>
          {squad.memberCount >= squad.maxMembers ? `${squad.name} is full` : newInvite.busy ? "Making an invite…" : "Invite someone"}
        </Primary>
      ) : null}
      <Secondary to={squadHref("settings")}>Squad settings</Secondary>
      <Note>There are no rankings. Quiet members are never called out.</Note>
    </Column>
  );
}

function SharedGoalView({ squad, stage }: Context & { squad: MySquad }) {
  const router = useRouter();
  const [goal, setGoal] = useState<SharedGoalPreview | null>(null);
  const [prefs, setPrefs] = useState<SharedGoalPreview["prefs"] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void getSharedGoal().then((result) => {
      if (alive) setGoal(result);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!goal) return <Skeleton className="mx-auto h-72 w-full max-w-[560px] rounded-[26px]" />;
  const current = prefs ?? goal.prefs;

  if (!goal.joined) {
    return (
      <Column>
        <SubHeader backHref={squadHref("members")} backLabel="Back" kicker={`${squad.name} · Shared goal`} title={`${goal.title}.`} subtitle={`${goal.suggestedBy} suggested a shared goal. Joining is optional.`} />
        <AriTile art={STAGE_ART[stage].full} label={`By ${goal.dueLabel}`} title={goal.outcome} body="Each person links their own tasks. Only “done” counts are shared." />
        <Panel title="What you’d contribute">
          <ul className="divide-y divide-[#ece6f6]">
            <ToggleRow title={`Link my task: ${goal.linkedTaskTitle}`} checked={current.linkTask} onChange={(linkTask) => setPrefs({ ...current, linkTask })} />
            <ToggleRow title="Show my done count" checked={current.showCount} onChange={(showCount) => setPrefs({ ...current, showCount })} />
            <ToggleRow title="Show task names" detail={`Off: ${squad.name} only sees numbers`} checked={current.showNames} onChange={(showNames) => setPrefs({ ...current, showNames })} />
          </ul>
        </Panel>
        <Primary
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void joinSharedGoal(current).then((result) => {
              setGoal(result);
              setBusy(false);
              router.replace(squadHref("goalProgress"));
            });
          }}
        >
          {busy ? "Joining…" : "Join the shared goal"}
        </Primary>
        <Secondary to={squadHref("members")}>Not this one</Secondary>
      </Column>
    );
  }

  return (
    <Column>
      <SubHeader backHref={squadHref("members")} backLabel="Back" kicker={`${squad.name} · Shared goal`} title={`${goal.title}.`} subtitle={`${goal.joinedCount} of ${goal.memberCount} people have joined · ${goal.daysLeft} days left`} />
      <Panel>
        <ProgressBar label="Together" value={goal.doneCount} max={goal.totalCount} valueLabel={`${goal.doneCount} / ${goal.totalCount} tasks`} helperText="Counts only. Nobody sees whose is whose unless they share names." />
      </Panel>
      <Panel title="Contributing">
        <Divided>
          {goal.contributors.map((person) => (
            <li key={person.name} className="flex items-center gap-3 py-3">
              <MemberFace name={person.name} isMe={person.name === "You"} stage={stage} />
              <span>
                <span className="block font-heading text-body font-bold text-text">{person.name}</span>
                <span className="block font-heading text-meta text-text-muted">
                  {person.done} {person.done === 1 ? "task" : "tasks"} done
                </span>
              </span>
            </li>
          ))}
        </Divided>
      </Panel>
      <Primary onClick={() => router.push("/planner?view=add")}>Add a linked task</Primary>
      <Secondary
        onClick={() => {
          void leaveSharedGoal().then((result) => {
            setGoal(result);
            setPrefs(null);
            router.replace(squadHref("goal"));
          });
        }}
      >
        Leave shared goal
      </Secondary>
    </Column>
  );
}

function SettingsView({ squad, members, myId }: Context & { squad: MySquad }) {
  const role = roleOf(members, myId);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [reminders, setReminders] = useState<ReminderSettings | null>(null);
  const [invites, setInvites] = useState<InvitationInfo[] | null>(null);

  useEffect(() => {
    let alive = true;
    void Promise.all([getPrivacy(), getReminders()]).then(([nextPrivacy, nextReminders]) => {
      if (!alive) return;
      setPrivacy(nextPrivacy);
      setReminders(nextReminders);
    });
    if (role !== "MEMBER") {
      void squadApi
        .invitations(squad.id)
        .then((list) => {
          if (alive) setInvites(list);
        })
        .catch(() => undefined);
    }
    return () => {
      alive = false;
    };
  }, [role, squad.id]);

  const updatePrivacy = (patch: Partial<PrivacySettings>) => {
    if (!privacy) return;
    const next = { ...privacy, ...patch };
    setPrivacy(next);
    void savePrivacy(next);
  };
  const open = invites?.filter(isOpen).length;

  return (
    <Column>
      <SubHeader backHref={squadHref("members")} backLabel="Back to members" kicker={`${squad.name} · Settings`} title="Squad settings." subtitle="Only owners see the bottom section." />
      <Panel title="What you share here">
        {privacy && reminders ? (
          <ul className="divide-y divide-[#ece6f6]">
            <ToggleRow title="Checked in today" checked={privacy.shareCheckedIn} onChange={(shareCheckedIn) => updatePrivacy({ shareCheckedIn })} />
            <ToggleRow title="Focus status" checked={privacy.shareFocusStatus} onChange={(shareFocusStatus) => updatePrivacy({ shareFocusStatus })} />
            <ToggleRow title="Stage-ups" checked={privacy.shareGrowthStage} onChange={(shareGrowthStage) => updatePrivacy({ shareGrowthStage })} />
            <ToggleRow
              title="Cheers notifications"
              checked={reminders.squadCheers}
              onChange={(squadCheers) => {
                const next = { ...reminders, squadCheers };
                setReminders(next);
                void saveReminders(next);
              }}
            />
          </ul>
        ) : (
          <Skeleton className="h-44 w-full rounded-[18px]" />
        )}
      </Panel>
      {role !== "MEMBER" ? (
        <Panel title="Owner">
          <Divided>
            <MenuRow href={squadHref("invites")} icon={<PersonIcon className="h-5 w-5" />} title="Manage invites" detail={open === undefined ? "Invites you’ve made" : `${open} open ${open === 1 ? "invite" : "invites"}`} />
            {role === "OWNER" ? <MenuRow href={squadHref("transfer")} icon={<ChartIcon className="h-5 w-5" />} title="Transfer ownership" /> : null}
          </Divided>
        </Panel>
      ) : null}
      <Panel>
        <Divided>
          <MenuRow href={squadHref("report")} tone="warm" icon={<SparkleIcon className="h-5 w-5" />} title="Report a problem" detail="Private to the Momentum team" />
          <MenuRow href={squadHref("leave")} tone="warm" icon={<HomeIcon className="h-5 w-5" />} title={`Leave ${squad.name}`} />
        </Divided>
      </Panel>
    </Column>
  );
}

function InvitesView(context: Context & { squad: MySquad }) {
  const { squad } = context;
  const [invites, setInvites] = useState<InvitationInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const newInvite = useNewInvite(context);

  useEffect(() => {
    let alive = true;
    void squadApi
      .invitations(squad.id)
      .then((list) => {
        if (alive) setInvites(list);
      })
      .catch((err) => {
        if (alive) setError(errorText(err, "We couldn’t load invites."));
      });
    return () => {
      alive = false;
    };
  }, [squad.id]);

  const open = (invites ?? []).filter(isOpen);
  const close = async (id: string) => {
    try {
      await squadApi.closeInvitation(id);
      setInvites((list) => (list ?? []).map((item) => (item.id === id ? { ...item, status: "CLOSED" } : item)));
    } catch (err) {
      setError(errorText(err, "We couldn’t close that invite."));
    }
  };

  return (
    <Column>
      <SubHeader backHref={squadHref("settings")} backLabel="Back to settings" kicker={`${squad.name} · Invites`} title="Open invites." subtitle="Close one and its code stops working." />
      <Panel>
        {invites === null && !error ? (
          <Skeleton className="h-24 w-full rounded-[18px]" />
        ) : open.length === 0 ? (
          <p className="py-3 font-heading text-body text-text-muted">No open invites.</p>
        ) : (
          <Divided>
            {open.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-body font-bold text-text">Expires {shortDate(item.expiresAt)}</span>
                  <span className="block font-heading text-meta text-text-muted">
                    Used {item.uses} of {item.maxUses}
                  </span>
                </span>
                <button type="button" onClick={() => void close(item.id)} className="rounded-full bg-accent-tint px-3 py-1.5 font-heading text-meta font-bold text-accent-strong">
                  Close
                </button>
              </li>
            ))}
          </Divided>
        )}
      </Panel>
      <ErrorLine message={error ?? newInvite.error} />
      <Primary onClick={() => void newInvite.create()} disabled={newInvite.busy}>
        {newInvite.busy ? "Making an invite…" : "New invite"}
      </Primary>
    </Column>
  );
}

function LeaveView({ squad, members, myId, reload }: Context & { squad: MySquad }) {
  const router = useRouter();
  const { showToast } = useShell();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const leave = async () => {
    if (roleOf(members, myId) === "OWNER") {
      router.push(squadHref("cantLeave"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await squadApi.leave(squad.id);
      showToast(`You left ${squad.name}`);
      reload();
      router.push(squadHref("find"));
    } catch (err) {
      if (err instanceof SquadApiError && err.code === "OWNER_TRANSFER_REQUIRED") {
        router.push(squadHref("cantLeave"));
        return;
      }
      setError(errorText(err, "We couldn’t do that. You’re still in the squad."));
      setBusy(false);
    }
  };

  return (
    <Column>
      <SubHeader backHref={squadHref("settings")} backLabel="Back to settings" kicker={`${squad.name} · Leave`} title={`Leave ${squad.name}?`} subtitle="You can rejoin later with a new invite." />
      <Panel title="What happens">
        <ul className="divide-y divide-[#ece6f6]">
          <StaticCheck on title="Your progress, XP and Ari stay yours" />
          <StaticCheck on title="Your shared-goal tasks become personal" />
          <StaticCheck on={false} title={`${squad.name} stops seeing your status`} />
        </ul>
      </Panel>
      <ErrorLine message={error} />
      <Primary onClick={() => void leave()} disabled={busy}>
        {busy ? "Leaving…" : `Leave ${squad.name}`}
      </Primary>
      <Secondary to={squadHref("settings")}>Stay</Secondary>
      <Note>Nobody gets a notification that you left.</Note>
    </Column>
  );
}

function CantLeaveView({ squad, members, myId }: Context & { squad: MySquad }) {
  const router = useRouter();
  const alone = members.every((member) => member.userId === myId);
  return (
    <Column>
      <SubHeader backHref={squadHref("leave")} backLabel="Back" kicker={`${squad.name} · Leave`} title="Pick a new owner first." subtitle={`${squad.name} needs someone looking after it.`} />
      <Note tone="warm" title="You’re the only owner">
        {alone ? "Invite someone and hand it over, then you can leave." : "Transfer ownership to another member, then you can leave."}
      </Note>
      {alone ? null : <Primary onClick={() => router.push(squadHref("transfer"))}>Transfer ownership</Primary>}
      <Secondary to={squadHref("settings")}>Stay for now</Secondary>
    </Column>
  );
}

function TransferView({ squad, members, myId, reload, stage }: Context & { squad: MySquad }) {
  const router = useRouter();
  const { showToast } = useShell();
  const candidates = members.filter((member) => member.userId !== myId);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const chosen = candidates.find((member) => member.userId === (selected ?? candidates[0]?.userId));

  const transfer = async () => {
    if (!chosen) return;
    setBusy(true);
    setError(null);
    try {
      await squadApi.transfer(squad.id, chosen.userId);
      showToast(`${chosen.name} now looks after ${squad.name}`);
      reload();
      router.push(squadHref("settings"));
    } catch (err) {
      setError(errorText(err, "We couldn’t hand it over. You’re still the owner."));
      setBusy(false);
    }
  };

  return (
    <Column>
      <SubHeader backHref={squadHref("settings")} backLabel="Back to settings" kicker={`${squad.name} · Ownership`} title={`Who should look after ${squad.name}?`} subtitle="They become the owner straight away. You stay as a member." />
      {candidates.length === 0 ? (
        <Note tone="warm" title="Nobody to hand over to yet">
          Invite someone first.
        </Note>
      ) : (
        <Panel>
          <ul role="radiogroup" aria-label="New owner" className="divide-y divide-[#ece6f6]">
            {candidates.map((member) => {
              const on = member.userId === chosen?.userId;
              return (
                <li key={member.userId}>
                  <button type="button" role="radio" aria-checked={on} onClick={() => setSelected(member.userId)} className="flex w-full items-center gap-3 py-3 text-left">
                    <MemberFace name={member.name} isMe={false} stage={stage} />
                    <span aria-hidden className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", on ? "bg-[image:var(--gradient-primary)] text-white shadow-pressable" : "bg-accent-tint shadow-inset")}>
                      {on ? <CheckIcon className="h-4 w-4" /> : null}
                    </span>
                    <span>
                      <span className="block font-heading text-body font-bold text-text">{member.name}</span>
                      <span className="block font-heading text-meta text-text-muted">Member since {shortDate(member.joinedAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
      <Note>Owners manage invites and settings. They can’t see anything extra about members.</Note>
      <ErrorLine message={error} />
      {chosen ? (
        <Primary onClick={() => void transfer()} disabled={busy}>
          {busy ? "Handing over…" : `Make ${chosen.name} the owner`}
        </Primary>
      ) : null}
      <Secondary to={squadHref("settings")}>Cancel</Secondary>
    </Column>
  );
}

function ReportView({ view, squad }: Context & { squad: MySquad; view: "report" | "reportSent" }) {
  const router = useRouter();
  const { showToast } = useShell();
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (view === "reportSent") {
    return (
      <Column>
        <SubHeader backHref={squadHref("settings")} backLabel="Back to settings" kicker="Report · Sent" title="Thanks for telling us." subtitle="We’ll review it within 24 hours." />
        <Note tone="success" title="Report received">
          You’ll get an update in Notifications. Nobody in {squad.name} was told.
        </Note>
        <Panel title="You can also">
          <Divided>
            <MenuRow onClick={() => showToast("Muted (preview)")} icon={<PersonIcon className="h-5 w-5" />} title="Mute this person" />
            <MenuRow href={squadHref("leave")} icon={<HomeIcon className="h-5 w-5" />} title={`Leave ${squad.name}`} />
          </Divided>
        </Panel>
        <Primary onClick={() => router.push(squadHref("settings"))}>Done</Primary>
      </Column>
    );
  }

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await submitSquadReport({ reason, details });
      router.replace(squadHref("reportSent"));
    } catch (err) {
      setError(errorText(err, "We couldn’t send that. Please try again."));
      setBusy(false);
    }
  };

  return (
    <Column>
      <SubHeader backHref={squadHref("settings")} backLabel="Back to settings" kicker="Report · Private" title="Tell us what happened." subtitle="Only the Momentum safety team sees this." />
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 font-heading text-body font-bold text-text">What’s wrong?</legend>
        <div role="radiogroup" aria-label="What’s wrong?" className="flex flex-wrap gap-2">
          {REPORT_REASONS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={option === reason}
              onClick={() => {
                setError(null);
                setReason(option);
              }}
            >
              <Pill selected={option === reason}>{option}</Pill>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="mb-2 block font-heading text-body font-bold text-text">Details · optional</span>
        <span className="flex items-center rounded-[22px] bg-surface px-5 py-3.5 shadow-raised focus-within:outline focus-within:outline-2 focus-within:outline-accent">
          <input value={details} maxLength={500} onChange={(event) => setDetails(event.target.value)} className="min-w-0 flex-1 bg-transparent font-heading text-body text-text outline-none" />
        </span>
      </label>
      <Note>The person isn’t told who reported. You can also leave or mute them right away.</Note>
      <ErrorLine message={error} />
      <Primary onClick={() => void send()} disabled={busy || !reason}>
        {busy ? "Sending…" : "Send report"}
      </Primary>
      <Secondary to={squadHref("settings")}>Cancel</Secondary>
    </Column>
  );
}

// ------------------------------------------------------------------ member profile & cheer

/** Figma 02 · Home · Member profile & cheer. */
function MemberView({ squad, members, myId, stage }: Context & { squad: MySquad }) {
  const params = useSearchParams();
  const member = members.find((item) => item.userId === params.get("id"));
  const [share, setShare] = useState<MemberShare | null>(null);
  const [cheer, setCheer] = useState<string>(CHEERS[0]);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const name = member?.name ?? "";

  useEffect(() => {
    let alive = true;
    if (!name) return;
    void getMemberShare(name).then((result) => {
      if (alive) setShare(result);
    });
    return () => {
      alive = false;
    };
  }, [name]);

  if (!member || member.userId === myId) {
    return (
      <Column>
        <SubHeader backHref={squadHref("members")} backLabel="Back to members" kicker={`${squad.name} · Member`} title="Member not found." subtitle="They may have left the squad." />
        <Secondary to={squadHref("members")}>Back to members</Secondary>
      </Column>
    );
  }

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendCheer(member.userId, cheer);
      setSent(cheer);
    } catch (err) {
      setError(errorText(err, "We couldn’t send that cheer."));
    } finally {
      setBusy(false);
    }
  };

  const full = FULLS[member.name];
  return (
    <Column>
      <SubHeader backHref={squadHref("members")} backLabel="Back to members" kicker={`${squad.name} · Member`} title={member.name} />
      <section className="flex min-h-[220px] items-stretch overflow-hidden rounded-[26px] bg-[#f8f0e2] shadow-floating">
        <div className="flex flex-1 flex-col items-start gap-2 p-5">
          {share?.status ? (
            <span className="flex items-center gap-1.5 rounded-full bg-success-tint px-3 py-1.5 font-heading text-meta font-bold text-success">
              <span aria-hidden className="h-2 w-2 rounded-full bg-success" />
              {share.status}
            </span>
          ) : null}
          {share?.stageLabel ? <span className="rounded-full bg-surface px-3 py-1.5 font-heading text-meta font-bold text-accent-strong shadow-raised">{share.stageLabel}</span> : null}
          {member.role === "OWNER" ? <span className="rounded-full bg-surface px-3 py-1.5 font-heading text-meta text-text-muted shadow-raised">Owner of {squad.name}</span> : null}
        </div>
        <div className="relative grid w-[120px] shrink-0 place-items-center bg-[#f1e8da] sm:w-[150px]">
          {full ? <Image src={full} alt={member.name} fill sizes="150px" className="object-contain object-bottom" /> : <FaceAvatar name={member.name} size={88} />}
        </div>
      </section>
      <Panel title={`What ${member.name} shares with ${squad.name}`}>
        {share === null ? (
          <Skeleton className="h-24 w-full rounded-[18px]" />
        ) : share.shares.length === 0 ? (
          <p className="py-2 font-heading text-body text-text-muted">Nothing shared yet.</p>
        ) : (
          <ul>
            {share.shares.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3 py-1.5">
                <span className="font-heading text-body font-bold text-text">{item.label}</span>
                <span className="shrink-0 font-heading text-meta text-text-muted">{item.value}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 font-heading text-meta text-text-muted">Only what {member.name} chose to share. No rankings, no private notes.</p>
      </Panel>
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-heading font-extrabold text-text">Send a cheer</h2>
        <div role="radiogroup" aria-label="Cheer" className="flex flex-wrap gap-2">
          {CHEERS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={option === cheer}
              onClick={() => {
                setCheer(option);
                setSent(null);
                setError(null);
              }}
            >
              <Pill selected={option === cheer}>
                <SparkleIcon className="mr-1.5 h-4 w-4" />
                {option}
              </Pill>
            </button>
          ))}
        </div>
      </section>
      {sent ? (
        <section role="status" className="flex items-center gap-3 rounded-[22px] bg-success-tint p-4">
          <FaceAvatar name="Ari" src={STAGE_ART[stage].face} size={40} />
          <p className="font-heading text-label text-text">
            Sent! Ari will wave from your stage in {member.name}’s room.
          </p>
        </section>
      ) : null}
      <ErrorLine message={error} />
      <Primary onClick={() => void send()} disabled={busy}>
        {busy ? "Sending…" : `Send ${cheer.toLowerCase()}`}
      </Primary>
    </Column>
  );
}
