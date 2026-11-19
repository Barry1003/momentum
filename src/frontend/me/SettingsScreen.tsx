"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { authClient } from "../auth/client";
import { STAGE_ART } from "../companion";
import { CheckOrb, Skeleton } from "../components";
import { clearFocus } from "../focus/storage";
import { AriTile, Split } from "../habits/views";
import { useShell } from "../home/AppShell";
import { GROWTH_STAGES, stageIndex } from "../home/growth";
import { CalendarIcon, ChevronRightIcon, ReadIcon, SparkleIcon } from "../home/icons";
import { useDisplayName } from "../home/useClientValues";
import { useToday } from "../hooks";
import { cn } from "../lib/cn";
import {
  DATA_EXPORT_URL,
  cancelAccountDeletion,
  confirmEmailChange,
  getAccount,
  requestAccountDeletion,
  requestDataExport,
  requestEmailChange,
  sendDeletionCode,
} from "../api/liveRepository";
import { getPrivacy, getProfileDetails, getQuietHours, getReminders, savePrivacy, saveProfileDetails, saveQuietHours, saveReminders } from "../api/liveRepository";
import type { AccountPreview, PrivacySettings, ProfileDetails, QuietDays, QuietHours, ReminderSettings } from "../mocks/types";
import { Badge, Panel, Pill, SubHeader } from "../planner/parts";
import { saveComfort, useComfort, type Comfort } from "./comfort";

type View =
  | "profile"
  | "profilePreview"
  | "profileSaved"
  | "privacy"
  | "reminders"
  | "quiet"
  | "comfort"
  | "account"
  | "email"
  | "emailVerify"
  | "data"
  | "signout"
  | "delete"
  | "deleteOwner"
  | "deleteFinal"
  | "deleteScheduled";

const VIEWS: View[] = [
  "profile",
  "profilePreview",
  "profileSaved",
  "privacy",
  "reminders",
  "quiet",
  "comfort",
  "account",
  "email",
  "emailVerify",
  "data",
  "signout",
  "delete",
  "deleteOwner",
  "deleteFinal",
  "deleteScheduled",
];

const href = (view: View) => `/me/settings?view=${view}`;

// ------------------------------------------------------------------ small parts

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-8 w-14 shrink-0 rounded-full transition", checked ? "bg-[image:var(--gradient-primary)] shadow-pressable" : "bg-accent-tint shadow-inset")}
    >
      <span className={cn("absolute top-1 h-6 w-6 rounded-full bg-surface shadow-raised transition-all", checked ? "left-7" : "left-1")} />
    </button>
  );
}

export function ToggleRow({ title, detail, checked, onChange }: { title: string; detail?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <span>
        <span className="block font-heading text-body font-bold text-text">{title}</span>
        {detail ? <span className="block font-heading text-meta text-text-muted">{detail}</span> : null}
      </span>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </li>
  );
}

export function Choice<T extends string>({ legend, value, options, onChange }: { legend: string; value: T; options: { value: T; label: string; disabled?: boolean }[]; onChange: (value: T) => void }) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2 font-heading text-body font-bold text-text">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option.value} type="button" role="radio" aria-checked={option.value === value} disabled={option.disabled} onClick={() => onChange(option.value)} className="disabled:opacity-50">
            <Pill selected={option.value === value}>{option.label}</Pill>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Primary({ children, onClick, disabled, type = "button" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 font-heading text-body font-bold text-white shadow-pressable disabled:opacity-60">
      {children}
    </button>
  );
}

export function Secondary({ children, onClick, to }: { children: ReactNode; onClick?: () => void; to?: string }) {
  const className = "block w-full rounded-full bg-surface py-4 text-center font-heading text-body font-bold text-accent-strong shadow-raised";
  return to ? (
    <Link href={to} className={className}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function Field({ label, value, onChange, tag, placeholder, type = "text", maxLength, readOnly }: { label: string; value: string; onChange?: (value: string) => void; tag?: string; placeholder?: string; type?: string; maxLength?: number; readOnly?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block font-heading text-body font-bold text-text">{label}</span>
      <span className={cn("flex items-center gap-3 rounded-[22px] bg-surface px-5 py-3.5 shadow-raised", readOnly ? "" : "focus-within:outline focus-within:outline-2 focus-within:outline-accent")}>
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) => onChange?.(event.target.value)}
          className="min-w-0 flex-1 bg-transparent font-heading text-body text-text outline-none placeholder:text-text-muted"
        />
        {tag ? <span className="shrink-0 font-heading text-meta font-bold text-accent-strong">{tag}</span> : null}
      </span>
    </label>
  );
}

export function Note({ tone = "tint", title, children }: { tone?: "tint" | "warm" | "success"; title?: string; children: ReactNode }) {
  const tones = { tint: "bg-accent-tint", warm: "bg-[#fdeedd]", success: "bg-success-tint" } as const;
  const titleTone = { tint: "text-accent-strong", warm: "text-[#9a5b12]", success: "text-success" } as const;
  return (
    <section className={cn("rounded-[22px] p-4", tones[tone])}>
      {title ? <p className={cn("font-heading text-body font-bold", titleTone[tone])}>{title}</p> : null}
      <p className={cn("font-heading text-label text-text", title ? "mt-1" : "")}>{children}</p>
    </section>
  );
}

export function ErrorLine({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="font-heading text-label text-warning">
      {message}
    </p>
  ) : null;
}

export function errorText(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function useLoaded<T>(load: () => Promise<T>): [T | null, (value: T) => void] {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    void load().then((result) => {
      if (alive) setValue(result);
    });
    return () => {
      alive = false;
    };
    // Loaded once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [value, setValue];
}

// ------------------------------------------------------------------ screen

/** Figma 07c · Profile & settings and 07d · Account. */
export function SettingsScreen() {
  const params = useSearchParams();
  const raw = params.get("view");
  const view: View = VIEWS.includes(raw as View) ? (raw as View) : "account";
  let body: ReactNode;
  switch (view) {
    case "profile":
    case "profilePreview":
    case "profileSaved":
      body = <ProfileFlow view={view} />;
      break;
    case "privacy":
      body = <PrivacyView />;
      break;
    case "reminders":
      body = <RemindersView />;
      break;
    case "quiet":
      body = <QuietView />;
      break;
    case "comfort":
      body = <ComfortView />;
      break;
    default:
      body = <AccountFlow view={view} />;
  }
  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pt-7 pb-36 sm:px-8 md:pt-10 md:pb-16">
      {body}
      <p role="status" className="mt-6 font-heading text-meta text-text-muted">
        Your profile, sharing, reminders and quiet hours are saved to your account. Email change, export and deletion are still previews.
      </p>
    </main>
  );
}

// ------------------------------------------------------------------ profile

function ProfileFlow({ view }: { view: "profile" | "profilePreview" | "profileSaved" }) {
  const router = useRouter();
  const params = useSearchParams();
  const savedName = useDisplayName();
  const today = useToday();
  const [details] = useLoaded<ProfileDetails>(() => getProfileDetails());
  const [draft, setDraft] = useState<{ name: string; handle: string; intention: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const name = draft?.name ?? savedName;
  const handle = draft?.handle ?? (details ? `@${details.handle}` : "");
  const intention = draft?.intention ?? details?.intention ?? "";
  const set = (patch: Partial<{ name: string; handle: string; intention: string }>) => {
    setError(null);
    setDraft({ name, handle, intention, ...patch });
  };

  const stage = today.data?.companion.stage ?? "teen";
  const art = STAGE_ART[stage];
  const index = stageIndex(stage);

  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      setError("Display names are 2 to 80 characters.");
      return;
    }
    setSaving(true);
    try {
      await saveProfileDetails({ handle, intention });
      if (trimmed !== savedName) {
        const response = await fetch("/api/me", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: trimmed }),
        });
        if (!response.ok) {
          throw new Error(response.status === 401 ? "Sign in to change your display name. Handle and intention were saved." : "Couldn’t save your name just now. Try again.");
        }
      }
      setDraft(null);
      router.push(href("profileSaved") + `&name=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setError(errorText(err, "Couldn’t save. Try again."));
      if (view !== "profile") router.push(href("profile"));
    } finally {
      setSaving(false);
    }
  }

  if (view === "profileSaved") {
    const shownName = (params.get("name") ?? savedName).slice(0, 80);
    return (
      <>
        <SubHeader backHref="/me" backLabel="Back to Me" kicker="Me · Profile" title="That feels like you." subtitle="Profile saved." />
        <Split
          left={<Note tone="success" title="Saved">{`Your squad now sees “${shownName}”. Your intention stays private.`}</Note>}
          right={<Primary onClick={() => router.push("/me")}>Back to Me</Primary>}
        />
      </>
    );
  }

  if (!details) return <Skeleton className="h-72 rounded-[28px]" />;

  if (view === "profilePreview") {
    return (
      <>
        <SubHeader backHref={href("profile")} backLabel="Back to edit" kicker="Me · Preview" title="What your squad sees." subtitle="This card is everything members can see." />
        <Split
          left={
            <AriTile art={art.full} label={`${name.toUpperCase()} · ${handle.toUpperCase()}`} title={`${GROWTH_STAGES[index]?.label} · Stage ${index + 1}`} body="Squad member">
              <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">Public card</span>
            </AriTile>
          }
          right={
            <>
              <Panel title="Not shown to members">
                <ul className="divide-y divide-outline">
                  {[
                    ["Email, tasks and goals", <ReadIcon key="a" className="h-5 w-5" />],
                    ["Your intention and reflections", <SparkleIcon key="b" className="h-5 w-5" />],
                    ["XP numbers and streaks", <CalendarIcon key="c" className="h-5 w-5" />],
                  ].map(([label, icon]) => (
                    <li key={label as string} className="flex items-center gap-3 py-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-tint text-accent-strong">{icon}</span>
                      <span className="font-heading text-body font-bold text-text">{label}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <ErrorLine message={error} />
              <Primary disabled={saving} onClick={() => void save()}>
                Save profile
              </Primary>
              <Secondary to={href("profile")}>Keep editing</Secondary>
            </>
          }
        />
      </>
    );
  }

  return (
    <>
      <SubHeader backHref="/me" backLabel="Back to Me" kicker="Me · Edit profile" title="Make it feel like you." subtitle="Nothing changes for others until you save." />
      <form
        className="mt-5 grid gap-5 lg:grid-cols-2 lg:gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="flex flex-col gap-5">
          <Field label="Display name" value={name} maxLength={80} tag="Public" onChange={(value) => set({ name: value })} />
          <Field label="Handle" value={handle} maxLength={16} tag="Public" onChange={(value) => set({ handle: value.startsWith("@") ? value : `@${value}` })} />
          <Field label="A private intention" value={intention} maxLength={140} tag="Only you" placeholder="Why you’re here, in a few words" onChange={(value) => set({ intention: value })} />
        </div>
        <div className="flex flex-col gap-5">
          <Panel title="Picture">
            <div className="flex items-center gap-3 py-2">
              <span className="h-11 w-11 overflow-hidden rounded-full bg-cream ring-[3px] ring-white">
                <Image src={art.face} alt="" width={44} height={44} className="h-full w-full object-cover" />
              </span>
              <span className="flex-1">
                <span className="block font-heading text-body font-bold text-text">Use Ari’s face</span>
                <span className="block font-heading text-meta text-text-muted">Default · changes as Ari grows</span>
              </span>
              <Badge>Selected</Badge>
            </div>
          </Panel>
          <ErrorLine message={error} />
          <Primary onClick={() => router.push(href("profilePreview"))}>Preview public profile</Primary>
          <Secondary onClick={() => void save()}>{saving ? "Saving…" : "Save"}</Secondary>
        </div>
      </form>
    </>
  );
}

// ------------------------------------------------------------------ privacy & notifications

function PrivacyView() {
  const router = useRouter();
  const { showToast } = useShell();
  const [privacy, setPrivacy] = useLoaded<PrivacySettings>(getPrivacy);
  const [reminders, setReminders] = useLoaded<ReminderSettings>(getReminders);
  const [quiet] = useLoaded<QuietHours>(getQuietHours);
  const [squad] = useLoaded<AccountPreview>(getAccount);
  const squadName = squad?.squadName ?? "Your squad";

  if (!privacy || !reminders || !quiet) return <Skeleton className="h-72 rounded-[28px]" />;
  const p = privacy;
  const r = reminders;

  return (
    <>
      <SubHeader backHref="/me" backLabel="Back to Me" kicker="Me · Settings" title="Share only what you choose." />
      <Split
        left={
          <>
            <Note>Everything starts private. Your squad only sees what you switch on here.</Note>
            <section>
              <h2 className="mb-3 font-display text-heading font-extrabold text-text">What {squadName} can see</h2>
              <Panel>
                <ul className="divide-y divide-outline">
                  <ToggleRow title="“Checked in today”" detail="Never your mood or notes" checked={p.shareCheckedIn} onChange={(value) => setPrivacy({ ...p, shareCheckedIn: value })} />
                  <ToggleRow title="Focus status" detail="Shows when you are focusing" checked={p.shareFocusStatus} onChange={(value) => setPrivacy({ ...p, shareFocusStatus: value })} />
                  <ToggleRow title="Finished shared tasks" detail="Only tasks you marked shared" checked={p.shareFinishedSharedTasks} onChange={(value) => setPrivacy({ ...p, shareFinishedSharedTasks: value })} />
                  <ToggleRow title="Growth stage" detail="Your companion’s stage in the room" checked={p.shareGrowthStage} onChange={(value) => setPrivacy({ ...p, shareGrowthStage: value })} />
                  <ToggleRow title="Streaks and XP details" detail="Off keeps numbers to yourself" checked={p.shareStreaksAndXp} onChange={(value) => setPrivacy({ ...p, shareStreaksAndXp: value })} />
                </ul>
              </Panel>
            </section>
          </>
        }
        right={
          <>
            <section>
              <h2 className="mb-3 font-display text-heading font-extrabold text-text">Reminders</h2>
              <Panel>
                <ul className="divide-y divide-outline">
                  <ToggleRow title="Daily plan nudge" detail={`${r.morningPlanTime} · one gentle reminder`} checked={r.morningPlan} onChange={(value) => setReminders({ ...r, morningPlan: value })} />
                  <ToggleRow title="Check-in reminder" detail={r.eveningCheckInTime} checked={r.eveningCheckIn} onChange={(value) => setReminders({ ...r, eveningCheckIn: value })} />
                  <ToggleRow title="Cheers from your squad" checked={r.squadCheers} onChange={(value) => setReminders({ ...r, squadCheers: value })} />
                  <li>
                    <Link href={href("quiet")} className="flex items-center justify-between gap-4 py-3">
                      <span>
                        <span className="block font-heading text-body font-bold text-text">Quiet hours</span>
                        <span className="block font-heading text-meta text-text-muted">Nothing reaches you overnight</span>
                      </span>
                      <span className="rounded-full bg-accent-tint px-3 py-1.5 font-heading text-meta font-bold text-accent-strong">{quiet.enabled ? `${quiet.from}–${quiet.to}` : "Off"}</span>
                    </Link>
                  </li>
                  <li>
                    <Link href={href("reminders")} className="flex items-center justify-between py-3 font-heading text-label font-bold text-accent-strong">
                      More reminder options
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                  </li>
                </ul>
              </Panel>
            </section>
            <Primary
              onClick={() =>
                void Promise.all([savePrivacy(p), saveReminders(r)]).then(() => {
                  showToast("Saved. Only what you switched on is shared.");
                  router.push("/me");
                })
              }
            >
              Save changes
            </Primary>
          </>
        }
      />
    </>
  );
}

function RemindersView() {
  const router = useRouter();
  const { showToast } = useShell();
  const [reminders, setReminders] = useLoaded<ReminderSettings>(getReminders);
  const [error, setError] = useState<string | null>(null);
  if (!reminders) return <Skeleton className="h-72 rounded-[28px]" />;
  const r = reminders;
  const time = (value: string, onChange: (next: string) => void, label: string) => (
    <input type="time" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md bg-transparent font-heading text-meta text-text-muted" />
  );

  return (
    <>
      <SubHeader backHref={href("privacy")} backLabel="Back to settings" kicker="Me · Reminders" title="A gentler kind of reminder." subtitle="Notifications are optional. Momentum works without them." />
      <Split
        left={
          <Panel title="Choose what helps">
            <ul className="divide-y divide-outline">
              <li className="flex items-center justify-between gap-4 py-3">
                <span>
                  <span className="block font-heading text-body font-bold text-text">Morning plan nudge</span>
                  {time(r.morningPlanTime, (value) => setReminders({ ...r, morningPlanTime: value }), "Morning plan time")}
                </span>
                <Toggle checked={r.morningPlan} onChange={(value) => setReminders({ ...r, morningPlan: value })} label="Morning plan nudge" />
              </li>
              <li className="flex items-center justify-between gap-4 py-3">
                <span>
                  <span className="block font-heading text-body font-bold text-text">Evening check-in</span>
                  {time(r.eveningCheckInTime, (value) => setReminders({ ...r, eveningCheckInTime: value }), "Evening check-in time")}
                </span>
                <Toggle checked={r.eveningCheckIn} onChange={(value) => setReminders({ ...r, eveningCheckIn: value })} label="Evening check-in" />
              </li>
              <ToggleRow title="Habit reminders" detail="Per habit" checked={r.habitReminders} onChange={(value) => setReminders({ ...r, habitReminders: value })} />
              <ToggleRow title="Squad cheers" detail="When someone cheers you" checked={r.squadCheers} onChange={(value) => setReminders({ ...r, squadCheers: value })} />
              <ToggleRow title="15-day review" detail="On the day it opens" checked={r.reviewDay} onChange={(value) => setReminders({ ...r, reviewDay: value })} />
            </ul>
          </Panel>
        }
        right={
          <>
            <Note>Your phone asks for permission only when you turn the first one on.</Note>
            <ErrorLine message={error} />
            <Primary
              onClick={() =>
                void saveReminders(r)
                  .then(() => {
                    showToast("Reminders saved.");
                    router.push(href("privacy"));
                  })
                  .catch((err) => setError(errorText(err, "Couldn’t save.")))
              }
            >
              Save
            </Primary>
          </>
        }
      />
    </>
  );
}

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function QuietView() {
  const router = useRouter();
  const { showToast } = useShell();
  const [quiet, setQuiet] = useLoaded<QuietHours>(getQuietHours);
  const [error, setError] = useState<string | null>(null);
  if (!quiet) return <Skeleton className="h-72 rounded-[28px]" />;
  const q = quiet;
  const update = (patch: Partial<QuietHours>) => {
    setError(null);
    setQuiet({ ...q, ...patch });
  };

  return (
    <>
      <SubHeader backHref={href("privacy")} backLabel="Back to settings" kicker="Me · Quiet hours" title="Room for quiet." subtitle="Nothing reaches you during these hours." />
      <Split
        left={
          <>
            <Panel>
              <ul>
                <ToggleRow title="Quiet hours" detail={q.days === "everyDay" ? "Every day" : q.days === "weeknights" ? "Weeknights" : q.days === "weekends" ? "Weekends" : "Custom days"} checked={q.enabled} onChange={(value) => update({ enabled: value })} />
              </ul>
            </Panel>
            <Field label="From" type="time" value={q.from} onChange={(value) => update({ from: value })} tag="Change" />
            <Field label="To" type="time" value={q.to} onChange={(value) => update({ to: value })} tag="Change" />
          </>
        }
        right={
          <>
            <Choice<QuietDays>
              legend="Days"
              value={q.days}
              onChange={(value) => update({ days: value })}
              options={[
                { value: "everyDay", label: "Every day" },
                { value: "weeknights", label: "Weeknights" },
                { value: "weekends", label: "Weekends" },
                { value: "custom", label: "Custom" },
              ]}
            />
            {q.days === "custom" ? (
              <div role="group" aria-label="Custom days" className="flex flex-wrap gap-2">
                {DAY_SHORT.map((label, day) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={q.customDays.includes(day)}
                    onClick={() => update({ customDays: q.customDays.includes(day) ? q.customDays.filter((item) => item !== day) : [...q.customDays, day] })}
                  >
                    <Pill selected={q.customDays.includes(day)}>{label}</Pill>
                  </button>
                ))}
              </div>
            ) : null}
            <Note>Anything that arrives waits quietly until the morning.</Note>
            <ErrorLine message={error} />
            <Primary
              onClick={() =>
                void saveQuietHours(q)
                  .then(() => {
                    showToast(q.enabled ? `Quiet hours ${q.from}–${q.to}.` : "Quiet hours off.");
                    router.push(href("privacy"));
                  })
                  .catch((err) => setError(errorText(err, "Couldn’t save.")))
              }
            >
              Save
            </Primary>
          </>
        }
      />
    </>
  );
}

function ComfortView() {
  const router = useRouter();
  const { showToast } = useShell();
  const saved = useComfort();
  const [draft, setDraft] = useState<Comfort | null>(null);
  const comfort = draft ?? saved;
  const update = (patch: Partial<Comfort>) => setDraft({ ...comfort, ...patch });

  return (
    <>
      <SubHeader backHref="/me" backLabel="Back to Me" kicker="Me · Comfort" title="Comfort comes first." subtitle="Choose what feels easiest to read and use." />
      <Split
        left={
          <>
            <Choice
              legend="Theme"
              value="system"
              onChange={() => undefined}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light", disabled: true },
                { value: "dark", label: "Dark · coming later", disabled: true },
              ]}
            />
            <Choice<Comfort["textSize"]>
              legend="Text size"
              value={comfort.textSize}
              onChange={(value) => update({ textSize: value })}
              options={[
                { value: "standard", label: "Standard" },
                { value: "large", label: "Large" },
                { value: "extraLarge", label: "Extra large" },
              ]}
            />
          </>
        }
        right={
          <>
            <Panel title="Motion & reading">
              <ul className="divide-y divide-outline">
                <ToggleRow title="Reduce motion" detail="Ari stays still, no confetti" checked={comfort.reduceMotion} onChange={(value) => update({ reduceMotion: value })} />
                <ToggleRow title="Readable font" detail="Wider letters, more spacing" checked={comfort.readableFont} onChange={(value) => update({ readableFont: value })} />
                <ToggleRow title="Haptics" detail="Small taps on completion, where the device supports it" checked={comfort.haptics} onChange={(value) => update({ haptics: value })} />
              </ul>
            </Panel>
            <Primary
              onClick={() => {
                saveComfort(comfort);
                setDraft(null);
                showToast("Saved on this device.");
                router.push("/me");
              }}
            >
              Save
            </Primary>
            <p className="font-heading text-meta text-text-muted">These choices are kept on this device only.</p>
          </>
        }
      />
    </>
  );
}

// ------------------------------------------------------------------ account

function AccountFlow({ view }: { view: View }) {
  const router = useRouter();
  const { showToast } = useShell();
  const [account, setAccount] = useLoaded<AccountPreview>(getAccount);
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [word, setWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // While a copy is being prepared, check back now and then.
  useEffect(() => {
    if (view !== "data" || account?.export.state !== "preparing") return;
    const id = window.setInterval(() => void getAccount().then(setAccount), 3000);
    return () => window.clearInterval(id);
  }, [view, account?.export.state, setAccount]);

  if (!account) return <Skeleton className="h-72 rounded-[28px]" />;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(errorText(err, "Something went wrong. Try again."));
    } finally {
      setBusy(false);
    }
  }

  const codeInput = (
    <label className="block">
      <span className="mb-2 block font-heading text-body font-bold text-text">Code</span>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={(event) => {
          setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
          setError(null);
        }}
        placeholder="______"
        aria-label="6-digit code"
        className="w-full rounded-[22px] bg-surface px-5 py-4 font-heading text-heading tracking-[0.5em] text-text shadow-raised outline outline-2 outline-accent placeholder:text-text-muted"
      />
    </label>
  );

  switch (view) {
    case "email":
      return (
        <>
          <SubHeader backHref={href("account")} backLabel="Back to account" kicker="Account · Email" title="Change your email carefully." subtitle="Your current email works until the new one is verified." />
          <Split
            left={
              <>
                <Field label="Current email" value={account.email} readOnly />
                <Field label="New email" type="email" value={newEmail} maxLength={254} placeholder="name@example.com" onChange={(value) => {
                  setNewEmail(value);
                  setError(null);
                }} />
              </>
            }
            right={
              <>
                <ErrorLine message={error} />
                <Primary
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await requestEmailChange(newEmail);
                      setAccount(await getAccount());
                      setCode("");
                      router.push(href("emailVerify"));
                    })
                  }
                >
                  Send code to new email
                </Primary>
                <Secondary to={href("account")}>Cancel</Secondary>
              </>
            }
          />
        </>
      );

    case "emailVerify":
      return (
        <>
          <SubHeader backHref={href("email")} backLabel="Back" kicker="Account · Verify" title="Confirm it’s really you." subtitle={account.pendingEmail ? `We sent a 6-digit code to ${account.pendingEmail}.` : "Start by entering your new email."} />
          <Split
            left={
              <>
                {codeInput}
                <Note>The code works for 10 minutes. Check spam if it doesn’t arrive.</Note>
              </>
            }
            right={
              <>
                <ErrorLine message={error} />
                <Primary
                  disabled={busy || code.length !== 6}
                  onClick={() =>
                    void run(async () => {
                      const next = await confirmEmailChange(code);
                      setAccount(next);
                      showToast(`Email changed to ${next.email}.`);
                      router.push(href("account"));
                    })
                  }
                >
                  Confirm new email
                </Primary>
                <Secondary onClick={() => void run(async () => {
                  if (account.pendingEmail) await requestEmailChange(account.pendingEmail);
                  showToast("A new code is on its way.");
                })}>
                  Resend code
                </Secondary>
                <Note>We’ll also tell your old address, just in case it wasn’t you.</Note>
              </>
            }
          />
        </>
      );

    case "data": {
      const state = account.export.state;
      if (state === "preparing") {
        return (
          <>
            <SubHeader backHref={href("account")} backLabel="Back to account" kicker="Account · Your data" title="Your copy is being prepared." subtitle="Requested just now." />
            <Split
              left={
                <section className="rounded-[24px] bg-surface p-5 shadow-raised">
                  <div className="flex items-baseline justify-between">
                    <p className="font-heading text-body font-bold text-text">Preparing</p>
                    <p className="font-heading text-meta text-accent-strong">Usually under 24 h</p>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-accent-tint shadow-inset">
                    <span className="block h-full w-2/5 animate-pulse rounded-full bg-[image:var(--gradient-primary)]" />
                  </div>
                </section>
              }
              right={<Note>We’ll email you a secure link when it’s ready. Nothing to rush.</Note>}
            />
          </>
        );
      }
      if (state === "ready") {
        return (
          <>
            <SubHeader backHref={href("account")} backLabel="Back to account" kicker="Account · Your data" title="Your copy is ready." subtitle="The link works for 7 days." />
            <Split
              left={<Note tone="success" title={account.export.fileName ?? "momentum.zip"}>JSON file · only your own data</Note>}
              right={
                <>
                  <Primary onClick={() => window.location.assign(DATA_EXPORT_URL)}>Download</Primary>
                  <Secondary to={href("account")}>Back to account</Secondary>
                </>
              }
            />
          </>
        );
      }
      return (
        <>
          <SubHeader backHref={href("account")} backLabel="Back to account" kicker="Account · Your data" title="Take a copy with you." subtitle="Everything you made, in one file." />
          <Split
            left={
              <Panel title="Included">
                <ul className="divide-y divide-outline">
                  {["Profile and settings", "Goals, tasks and habit history", "Check-ins, reflections and Life Audit", "Focus sessions and achievements"].map((item) => (
                    <li key={item} className="flex items-center gap-3 py-3">
                      <CheckOrb id={`inc-${item}`} size="sm" label={item} checked disabled onChange={() => undefined} />
                      <span className="font-heading text-body font-bold text-text">{item}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            }
            right={
              <>
                <Note>Squad members’ data isn’t included. Only your own.</Note>
                <Primary disabled={busy} onClick={() => void run(async () => setAccount(await requestDataExport()))}>
                  Request my copy
                </Primary>
              </>
            }
          />
        </>
      );
    }

    case "signout":
      return (
        <>
          <SubHeader backHref={href("account")} backLabel="Back to account" kicker="Account" title="Sign out for now?" subtitle="Signing out doesn’t delete anything." />
          <Split
            left={<Note>Your tasks, habits and Ari will be right here when you sign back in.</Note>}
            right={
              <>
                <ErrorLine message={error} />
                <Primary
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const result = await authClient.signOut();
                      if (result?.error) throw new Error("Couldn’t sign out just now. Try again.");
                      clearFocus();
                      router.replace("/onboarding/sign-in");
                    })
                  }
                >
                  Sign out
                </Primary>
                <Secondary to="/me">Stay signed in</Secondary>
              </>
            }
          />
        </>
      );

    case "delete":
      return (
        <>
          <SubHeader backHref={href("account")} backLabel="Back to account" kicker="Account · Delete" title="Before you leave." subtitle="Deleting is permanent after 14 days." />
          <Split
            left={
              <Panel title="What happens">
                <ul className="divide-y divide-outline">
                  <li className="py-3">
                    <span className="block font-heading text-body font-bold text-text">Access ends today</span>
                    <span className="block font-heading text-meta text-text-muted">You can cancel within 14 days</span>
                  </li>
                  <li className="py-3">
                    <span className="block font-heading text-body font-bold text-text">Your private work is deleted</span>
                    <span className="block font-heading text-meta text-text-muted">Tasks, habits, reflections, Ari</span>
                  </li>
                  <li>
                    <Link href={href("data")} className="flex items-center justify-between py-3">
                      <span>
                        <span className="block font-heading text-body font-bold text-text">Want a copy first?</span>
                        <span className="block font-heading text-meta text-text-muted">Download my data</span>
                      </span>
                      <ChevronRightIcon className="h-4 w-4 text-text-muted" />
                    </Link>
                  </li>
                </ul>
              </Panel>
            }
            right={
              <>
                <ErrorLine message={error} />
                <Primary
                  disabled={busy}
                  onClick={() =>
                    account.ownsSquadAlone
                      ? router.push(href("deleteOwner"))
                      : void run(async () => {
                          await sendDeletionCode();
                          setCode("");
                          setWord("");
                          router.push(href("deleteFinal"));
                        })
                  }
                >
                  Continue
                </Primary>
                <Secondary to={href("account")}>Keep my account</Secondary>
              </>
            }
          />
        </>
      );

    case "deleteOwner":
      return (
        <>
          <SubHeader backHref={href("delete")} backLabel="Back" kicker="Account · Delete" title="Pass the room on first." subtitle={`You’re the only owner of ${account.squadName ?? "your squad"}.`} />
          <Split
            left={<Note tone="warm" title="Deletion can’t continue yet">{`Choose a new owner for ${account.squadName ?? "your squad"}, then come back.`}</Note>}
            right={
              <>
                <Primary
                  onClick={() =>
                    router.push("/squad?view=transfer")
                  }
                >
                  Transfer ownership
                </Primary>
                <Secondary to={href("delete")}>Back</Secondary>
              </>
            }
          />
        </>
      );

    case "deleteFinal":
      return (
        <>
          <SubHeader backHref={href("delete")} backLabel="Back" kicker="Account · Delete" title="One careful check." subtitle={`Enter the code we sent to ${account.email}.`} />
          <Split
            left={
              <>
                {codeInput}
                <Field label="Type DELETE to confirm" value={word} maxLength={6} onChange={(value) => {
                  setWord(value);
                  setError(null);
                }} />
                <Note>The code works for 10 minutes. Your account is removed 14 days after you confirm, and you can cancel until then.</Note>
              </>
            }
            right={
              <>
                <ErrorLine message={error} />
                <Primary
                  disabled={busy || code.length !== 6 || word !== "DELETE"}
                  onClick={() =>
                    void run(async () => {
                      setAccount(await requestAccountDeletion(code, word));
                      router.push(href("deleteScheduled"));
                    })
                  }
                >
                  Delete my account
                </Primary>
                <Secondary onClick={() => void run(async () => {
                  await sendDeletionCode();
                  showToast("A new code is on its way.");
                })}>
                  Send a new code
                </Secondary>
                <Secondary to={href("account")}>Cancel</Secondary>
              </>
            }
          />
        </>
      );

    case "deleteScheduled":
      return (
        <>
          <SubHeader backHref={href("account")} backLabel="Back to account" kicker="Account · Delete" title="Deletion is scheduled." subtitle={account.deletionScheduledFor ? `It becomes permanent on ${account.deletionScheduledFor}.` : "Nothing is scheduled."} />
          <Split
            left={<Note tone="warm" title="Nothing is deleted yet">You can cancel any time before that date, and everything stays as it is.</Note>}
            right={
              <>
                <Primary
                  onClick={() =>
                    void run(async () => {
                      setAccount(await cancelAccountDeletion());
                      showToast("Deletion cancelled. Welcome back.");
                      router.push(href("account"));
                    })
                  }
                >
                  Cancel deletion
                </Primary>
                <Secondary to="/me">Back to Me</Secondary>
              </>
            }
          />
        </>
      );

    default:
      return (
        <>
          <SubHeader backHref="/me" backLabel="Back to Me" kicker="Me · Account" title="Your account. Your choices." subtitle={`${account.email} · verified`} />
          <Split
            left={
              <Panel>
                <ul className="divide-y divide-outline">
                  {(
                    [
                      ["Account email", account.email, href("email")],
                      ["Download my data", account.export.state === "none" ? "A copy of everything you made" : account.export.state === "ready" ? "Your copy is ready" : "Being prepared", href("data")],
                      ["Sign out", "", href("signout")],
                      ["Delete account", account.deletionScheduledFor ? `Scheduled for ${account.deletionScheduledFor}` : "Permanent, after a careful check", account.deletionScheduledFor ? href("deleteScheduled") : href("delete")],
                    ] as const
                  ).map(([title, detail, to]) => (
                    <li key={title}>
                      <Link href={to} className="flex items-center gap-3 py-3">
                        <span className={cn("grid h-10 w-10 place-items-center rounded-full", title === "Delete account" ? "bg-[#fdeedd] text-[#9a5b12]" : "bg-accent-tint text-accent-strong")}>
                          <SparkleIcon className="h-5 w-5" />
                        </span>
                        <span className="flex-1">
                          <span className="block font-heading text-body font-bold text-text">{title}</span>
                          {detail ? <span className="block font-heading text-meta text-text-muted">{detail}</span> : null}
                        </span>
                        <ChevronRightIcon className="h-4 w-4 text-text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            }
            right={<Note>We never sell or share your data.</Note>}
          />
        </>
      );
  }
}
