"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { STAGE_ART } from "../companion";
import { CheckOrb, Skeleton } from "../components";
import { AriTile, Split } from "../habits/views";
import { useShell } from "../home/AppShell";
import { GROWTH_STAGES, stageIndex } from "../home/growth";
import { BellIcon, CheckIcon, ChevronRightIcon, PlayIcon, ReadIcon, SparkleIcon, WaterIcon } from "../home/icons";
import { useDisplayName } from "../home/useClientValues";
import { cn } from "../lib/cn";
import { getAchievement, getAchievements, getCompanionOverview, getProfileSummary, getProgress, setAchievementShared } from "../mocks/repository";
import type { Achievement, CompanionOverview, ProfileSummary, ProgressSummary } from "../mocks/types";
import { Badge, Panel, Pill, SubHeader } from "../planner/parts";
import { hoursMinutes, weekStart } from "../progress/format";

type MeView = "hub" | "companion" | "journey" | "achievements" | "achievement";
const VIEWS: MeView[] = ["hub", "companion", "journey", "achievements", "achievement"];

function localIso(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function useAsync<T>(key: string, load: () => Promise<T>): T | null {
  const [state, setState] = useState<{ key: string; value: T } | null>(null);
  useEffect(() => {
    let alive = true;
    void load().then((value) => {
      if (alive) setState({ key, value });
    });
    return () => {
      alive = false;
    };
    // The key says when the request really changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state && state.key === key ? state.value : null;
}

const ICONS: Record<Achievement["icon"], ReactNode> = {
  check: <CheckIcon className="h-5 w-5" />,
  play: <PlayIcon className="h-5 w-5" />,
  water: <WaterIcon className="h-5 w-5" />,
  person: <SparkleIcon className="h-5 w-5" />,
  read: <ReadIcon className="h-5 w-5" />,
  sparkle: <SparkleIcon className="h-5 w-5" />,
};

function MenuRow({ href, onClick, icon, title, detail }: { href?: string; onClick?: () => void; icon: ReactNode; title: string; detail: string }) {
  const inner = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#e2d8f8)] text-accent-strong shadow-raised">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-body font-bold text-text">{title}</span>
        <span className="block font-heading text-meta text-text-muted">{detail}</span>
      </span>
      <ChevronRightIcon className="h-4 w-4 text-text-muted" />
    </>
  );
  const className = "flex w-full items-center gap-3 py-3 text-left";
  return (
    <li>
      {href ? (
        <Link href={href} className={className}>
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          {inner}
        </button>
      )}
    </li>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-[22px] bg-surface py-5 shadow-raised">
      <span className="font-display text-title font-extrabold text-text">{value}</span>
      <span className="font-heading text-meta text-text-muted">{label}</span>
    </div>
  );
}

/** Figma 07 · Me · Companion: profile hub, companion, growth journey, achievements. */
export function MeScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { showToast } = useShell();
  const displayName = useDisplayName();
  const raw = params.get("view");
  const view: MeView = VIEWS.includes(raw as MeView) ? (raw as MeView) : "hub";
  const achievementId = params.get("id") ?? "";
  const [shareVersion, setShareVersion] = useState(0);

  const overview = useAsync<CompanionOverview>(`overview-${view}`, getCompanionOverview);
  const profile = useAsync<ProfileSummary>(`profile-${displayName}`, () => getProfileSummary(displayName));
  const achievements = useAsync<Achievement[]>(`achievements-${view}-${shareVersion}`, getAchievements);
  const achievement = useAsync<{ item: Achievement | null }>(`achievement-${achievementId}-${shareVersion}`, async () => ({ item: await getAchievement(achievementId) }));
  const week = useAsync<ProgressSummary>(view === "companion" ? "week" : "none", () => {
    const today = localIso();
    return getProgress(weekStart(today), today);
  });

  const stage = overview?.stage ?? "teen";
  const art = STAGE_ART[stage];
  const index = stageIndex(stage);
  const stageLabel = GROWTH_STAGES[index]?.label ?? "";
  const next = GROWTH_STAGES[index + 1];
  const toGo = overview?.xpToNextStage ? Math.max(0, overview.xpToNextStage - overview.xp) : null;
  const comingNext = (what: string) => () => showToast(`${what} arrives with the next Me screens (07c–07d).`);
  const earned = (achievements ?? []).filter((item) => item.earnedOn);
  const inProgress = (achievements ?? []).filter((item) => !item.earnedOn);

  let body: ReactNode;
  if (!overview) {
    body = <Skeleton className="h-72 rounded-[28px]" />;
  } else if (view === "companion") {
    body = (
      <>
        <SubHeader backHref="/me" backLabel="Back to Me" kicker="Me · Companion" title="Ari, your companion." subtitle="Ari grows when you show up. Growth never goes backwards." />
        <Split
          left={
            <>
              <AriTile
                art={art.full}
                label={`Stage ${index + 1} of 5 · ${stageLabel}`}
                title={`${overview.xp.toLocaleString("en-GB")} XP`}
                body={next && toGo !== null ? `${toGo.toLocaleString("en-GB")} XP to ${next.label}. ${overview.paceNote ?? ""}` : "Fully grown. Every day still counts."}
              >
                <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">{overview.mood}</span>
              </AriTile>
              {next && overview.xpToNextStage ? (
                <section className="rounded-[24px] bg-surface p-5 shadow-raised">
                  <div className="flex items-baseline justify-between">
                    <p className="font-heading text-body font-bold text-text">Next stage: {next.label}</p>
                    <p className="font-heading text-meta font-bold text-accent-strong">
                      {overview.xp.toLocaleString("en-GB")} / {overview.xpToNextStage.toLocaleString("en-GB")}
                    </p>
                  </div>
                  <div className="mt-3 h-2.5 rounded-full bg-accent-tint shadow-inset">
                    <span className="block h-full rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${Math.min(100, (overview.xp / overview.xpToNextStage) * 100)}%` }} />
                  </div>
                </section>
              ) : null}
            </>
          }
          right={
            <>
              <Panel title="Ari">
                <ul className="divide-y divide-outline">
                  <MenuRow href="/me?view=journey" icon={<ReadIcon className="h-5 w-5" />} title="Growth journey" detail={`${index + 1} stages unlocked`} />
                  <MenuRow
                    href="/me?view=achievements"
                    icon={<SparkleIcon className="h-5 w-5" />}
                    title="Achievements"
                    detail={`${overview.achievementsEarned} earned${overview.achievementsClose ? ` · ${overview.achievementsClose} close` : ""}`}
                  />
                  <MenuRow href="/me/studio" icon={<SparkleIcon className="h-5 w-5" />} title="Character Studio" detail="Look, room, stage colour" />
                </ul>
              </Panel>
              {week ? (
                <div className="flex gap-3">
                  <StatTile value={String(week.activeDays)} label="days this week" />
                  <StatTile value={hoursMinutes(week.focusMinutes)} label="focused" />
                  <StatTile value={String(week.tasksDone)} label="tasks done" />
                </div>
              ) : (
                <Skeleton className="h-24 rounded-[22px]" />
              )}
            </>
          }
        />
      </>
    );
  } else if (view === "journey") {
    body = (
      <>
        <SubHeader backHref="/me?view=companion" backLabel="Back to companion" kicker="Companion · Growth journey" title="How far Ari has come." subtitle="Each stage stays unlocked forever." />
        <Split
          left={
            <Panel title="Stages">
              <ul className="divide-y divide-outline">
                {overview.stages.map((item, position) => {
                  const unlocked = item.unlockedOn !== null;
                  const label = GROWTH_STAGES[position]?.label ?? item.stage;
                  return (
                    <li key={item.stage} className="flex items-center gap-3 py-3">
                      <CheckOrb id={`stage-${item.stage}`} size="sm" label={`${label}: ${unlocked ? "unlocked" : "still ahead"}`} checked={unlocked} disabled onChange={() => undefined} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-heading text-body font-bold text-text">{label}</span>
                        <span className="block font-heading text-meta text-text-muted">
                          {unlocked
                            ? `Unlocked ${item.unlockedOn}${item.from ? ` · ${item.from.toLocaleString("en-GB")} XP` : " · first day"}`
                            : `${item.from.toLocaleString("en-GB")} XP · ${Math.max(0, item.from - overview.xp).toLocaleString("en-GB")} to go`}
                        </span>
                      </span>
                      {item.stage === stage ? <Badge>Now</Badge> : position === index + 1 ? <Badge tone="warm">Next</Badge> : null}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          }
          right={
            <>
              {next && toGo !== null ? (
                <AriTile art={STAGE_ART[next.stage].full} label={`Next · ${next.label}`} title={`${toGo.toLocaleString("en-GB")} XP to go`} body="Tasks, habits and focus all count. Quiet days never subtract." />
              ) : null}
              <section className="rounded-[22px] bg-success-tint p-4">
                <p className="font-heading text-body font-bold text-success">Ari never shrinks</p>
                <p className="mt-1 font-heading text-label text-text">Missed days pause growth. They don’t reverse it.</p>
              </section>
            </>
          }
        />
      </>
    );
  } else if (view === "achievements") {
    const filter = params.get("filter") === "earned" ? "earned" : params.get("filter") === "progress" ? "progress" : "all";
    const first = params.get("preview") === "first" || (achievements !== null && earned.length === 0);
    if (first) {
      body = (
        <>
          <SubHeader backHref="/me" backLabel="Back to Me" kicker="Me · Achievements" title="Your story starts small." subtitle="Your first little win will feel right at home here." />
          <Split
            left={<AriTile art={art.full} label="Nothing yet · that’s fine" title="Little wins, kept." body="Not a scoreboard. A collection of the small brave things you do." />}
            right={
              <Panel title="Easy first ones">
                <ul className="divide-y divide-outline">
                  {[
                    ["First little step", "Finish any task", "/planner"],
                    ["Made a little room", "Try one focus session", "/focus"],
                    ["A moment to notice", "Do a daily check-in", "/check-in"],
                  ].map(([title, detail, href]) => (
                    <li key={title}>
                      <Link href={href} className="flex items-center gap-3 py-3">
                        <CheckOrb id={`first-${title}`} size="sm" label={title} checked={false} disabled onChange={() => undefined} />
                        <span>
                          <span className="block font-heading text-body font-bold text-text">{title}</span>
                          <span className="block font-heading text-meta text-text-muted">{detail}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            }
          />
        </>
      );
    } else {
      const row = (item: Achievement) => (
        <li key={item.id}>
          <Link href={`/me?view=achievement&id=${item.id}`} className="flex items-center gap-3 py-3">
            <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", item.earnedOn ? "bg-success-tint text-success" : "bg-accent-tint text-accent-strong")}>{ICONS[item.icon]}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-body font-bold text-text">{item.title}</span>
              <span className="block font-heading text-meta text-text-muted">
                {item.criteria}
                {item.progress ? ` · ${item.progress.done} of ${item.progress.total}` : ""}
              </span>
            </span>
            {item.progress ? <Badge>{Math.round((item.progress.done / item.progress.total) * 100)}%</Badge> : null}
          </Link>
        </li>
      );
      body = (
        <>
          <SubHeader backHref="/me" backLabel="Back to Me" kicker="Companion · Achievements" title="Little things worth noticing." subtitle={`${earned.length} earned. No leaderboards.`} />
          <Split
            left={
              <div className="flex flex-wrap gap-2">
                {[
                  ["all", "All"],
                  ["earned", "Earned"],
                  ["progress", "In progress"],
                ].map(([value, label]) => (
                  <Link key={value} href={value === "all" ? "/me?view=achievements" : `/me?view=achievements&filter=${value}`} scroll={false}>
                    <Pill selected={filter === value}>{label}</Pill>
                  </Link>
                ))}
              </div>
            }
            right={
              <>
                {achievements === null ? <Skeleton className="h-64 rounded-[26px]" /> : null}
                {filter !== "progress" && earned.length ? (
                  <Panel title="Earned">
                    <ul className="divide-y divide-outline">{earned.map(row)}</ul>
                  </Panel>
                ) : null}
                {filter !== "earned" && inProgress.length ? (
                  <Panel title="In progress">
                    <ul className="divide-y divide-outline">{inProgress.map(row)}</ul>
                  </Panel>
                ) : null}
                <p className="rounded-[20px] bg-accent-tint p-4 font-heading text-label text-text">Achievements are private unless you choose to share one.</p>
              </>
            }
          />
        </>
      );
    }
  } else if (view === "achievement") {
    const item = achievement?.item ?? null;
    if (!achievement) body = <Skeleton className="h-72 rounded-[28px]" />;
    else if (!item) {
      body = <SubHeader backHref="/me?view=achievements" backLabel="Back to achievements" kicker="Achievement" title="We couldn’t find that one." subtitle="It may have been renamed." />;
    } else if (item.earnedOn) {
      body = (
        <>
          <SubHeader backHref="/me?view=achievements" backLabel="Back to achievements" kicker="Achievement · Earned" title={item.title} subtitle={`Earned ${item.earnedOn}`} />
          <Split
            left={
              <AriTile art={art.full} label={item.criteria} title={item.headline} body={item.body}>
                <span className="mt-3 flex gap-2">
                  <span className="rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">+{item.xp} XP</span>
                  <span className="rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">{item.isShared ? "Shared" : "Private"}</span>
                </span>
              </AriTile>
            }
            right={
              <>
                <Panel title="What counted">
                  <ul className="divide-y divide-outline">
                    {item.counted.map((entry) => (
                      <li key={entry.title} className="flex items-center gap-3 py-3">
                        <CheckOrb id={`counted-${entry.title}`} size="sm" label={entry.title} checked={entry.done} disabled onChange={() => undefined} />
                        <span>
                          <span className="block font-heading text-body font-bold text-text">{entry.title}</span>
                          <span className="block font-heading text-meta text-text-muted">{entry.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
                <button
                  type="button"
                  onClick={() =>
                    void setAchievementShared(item.id, !item.isShared).then(() => {
                      setShareVersion((value) => value + 1);
                      showToast(item.isShared ? "Back to private." : "Shared with your squad.");
                    })
                  }
                  className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 font-heading text-body font-bold text-white shadow-pressable"
                >
                  {item.isShared ? "Make private again" : "Share with your squad"}
                </button>
                <button type="button" onClick={() => router.push("/me?view=achievements")} className="w-full rounded-full bg-surface py-4 font-heading text-body font-bold text-accent-strong shadow-raised">
                  {item.isShared ? "Keep shared" : "Keep private"}
                </button>
              </>
            }
          />
        </>
      );
    } else {
      const progress = item.progress ?? { done: 0, total: 1 };
      body = (
        <>
          <SubHeader backHref="/me?view=achievements" backLabel="Back to achievements" kicker="Achievement · In progress" title={item.title} subtitle={item.headline} />
          <Split
            left={
              <section className="rounded-[24px] bg-surface p-5 shadow-raised">
                <div className="flex items-baseline justify-between">
                  <p className="font-heading text-body font-bold text-text">{item.criteria}</p>
                  <p className="font-heading text-meta font-bold text-accent-strong">
                    {progress.done} of {progress.total}
                  </p>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-accent-tint shadow-inset">
                  <span className="block h-full rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                </div>
                <p className="mt-2 font-heading text-meta text-text-muted">{item.body}</p>
              </section>
            }
            right={
              <>
                <Panel title="So far">
                  <ul className="divide-y divide-outline">
                    {item.counted.map((entry) => (
                      <li key={entry.title} className="flex items-center gap-3 py-3">
                        <CheckOrb id={`sofar-${entry.title}`} size="sm" label={entry.title} checked={entry.done} disabled onChange={() => undefined} />
                        <span>
                          <span className="block font-heading text-body font-bold text-text">{entry.title}</span>
                          <span className="block font-heading text-meta text-text-muted">{entry.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
                {item.icon === "play" ? (
                  <Link href="/focus" className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable">
                    Start a focus session
                  </Link>
                ) : null}
                <Link href="/me?view=achievements" className="w-full rounded-full bg-surface py-4 text-center font-heading text-body font-bold text-accent-strong shadow-raised">
                  Back to achievements
                </Link>
              </>
            }
          />
        </>
      );
    }
  } else {
    body = (
      <>
        <header>
          <p className="font-heading text-meta font-bold tracking-widest text-text-muted uppercase">Me</p>
          <h1 className="mt-1 font-display text-display font-extrabold text-text">Your space.</h1>
        </header>
        <Split
          left={
            <>
              <Link href="/me?view=companion" className="flex items-stretch overflow-hidden rounded-[28px] bg-[#f8f0e2] shadow-floating">
                <span className="flex flex-1 flex-col justify-between p-5">
                  <span>
                    <span className="block font-display text-title font-extrabold text-text">{profile?.displayName ?? displayName}</span>
                    <span className="block font-heading text-label text-text-muted">
                      {profile?.handle ?? ""}
                      {profile?.squadName ? ` · ${profile.squadName}` : ""}
                    </span>
                    <span className="mt-2 inline-block rounded-full bg-surface px-3 py-1 font-heading text-meta font-bold text-accent-strong shadow-raised">
                      {stageLabel} · Stage {index + 1} of 5
                    </span>
                  </span>
                  <span className="mt-6 flex gap-6">
                    {[
                      [overview.xp.toLocaleString("en-GB"), "XP"],
                      [String(profile?.activeDays ?? 0), "days"],
                      [String(overview.achievementsEarned), "badges"],
                    ].map(([value, label]) => (
                      <span key={label}>
                        <span className="block font-display text-heading font-extrabold text-text">{value}</span>
                        <span className="block font-heading text-meta text-text-muted">{label}</span>
                      </span>
                    ))}
                  </span>
                </span>
                <span className="relative w-[110px] shrink-0">
                  <Image src={art.full} alt="Ari" fill sizes="110px" className="object-contain object-bottom" />
                </span>
              </Link>
              <Panel>
                <ul className="divide-y divide-outline">
                  <MenuRow href="/me/studio" icon={<SparkleIcon className="h-5 w-5" />} title="Character Studio" detail="Look, room, stage colour, extras" />
                  <MenuRow href="/me?view=achievements" icon={<ReadIcon className="h-5 w-5" />} title="Achievements" detail={`${overview.achievementsEarned} earned · never taken away`} />
                  <MenuRow onClick={comingNext("Edit profile")} icon={<SparkleIcon className="h-5 w-5" />} title="Edit profile" detail="Name, handle, private intention" />
                </ul>
              </Panel>
            </>
          }
          right={
            <>
              <Panel>
                <ul className="divide-y divide-outline">
                  <MenuRow onClick={comingNext("Privacy & sharing")} icon={<CheckIcon className="h-5 w-5" />} title="Privacy & sharing" detail="Private by default" />
                  <MenuRow onClick={comingNext("Notifications & quiet hours")} icon={<BellIcon className="h-5 w-5" />} title="Notifications & quiet hours" detail="Quiet 22:00–08:00" />
                  <MenuRow onClick={comingNext("Comfort & accessibility")} icon={<SparkleIcon className="h-5 w-5" />} title="Comfort & accessibility" detail="Reduced motion · text size" />
                  <MenuRow onClick={comingNext("Account")} icon={<SparkleIcon className="h-5 w-5" />} title="Account" detail="Email, export, sign out" />
                </ul>
              </Panel>
              {profile?.squadName ? (
                <Panel>
                  <ul>
                    <MenuRow href="/home?tab=squad" icon={<SparkleIcon className="h-5 w-5" />} title={profile.squadName} detail={`${profile.squadMembers} members · squad room`} />
                  </ul>
                </Panel>
              ) : null}
            </>
          }
        />
      </>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pt-7 pb-36 sm:px-8 md:pt-10 md:pb-16">
      {body}
      <p role="status" className="mt-6 font-heading text-meta text-text-muted">
        Preview: achievements, looks and XP here are examples, not saved account data yet.
      </p>
    </main>
  );
}
