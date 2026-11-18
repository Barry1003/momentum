"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { CompanionReaction } from "../companion";
import { Skeleton } from "../components";
import { useNotifications, useSquad, type UseTodayResult } from "../hooks";
import { cn } from "../lib/cn";
import { useShell } from "./AppShell";
import { CompanionHero } from "./CompanionHero";
import { FirstDayActions, QuietDayActions } from "./EmptyStates";
import { BellIcon } from "./icons";
import { GrowthStudioCard, HabitsCard, MyProgressCard, PrioritiesCard, UpNextCard } from "./MySpace";
import { SquadRoom } from "./SquadRoom";
import { useDisplayName, useGreetingLine } from "./useClientValues";

type HomeMode = "normal" | "first" | "quiet";

function BellLink({ unread }: { unread: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
      className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface text-text shadow-raised"
    >
      <BellIcon className="h-5 w-5" />
      {unread ? <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white" /> : null}
    </Link>
  );
}

function SpaceToggle({ tab, className }: { tab: "space" | "squad"; className?: string }) {
  const item = (key: "space" | "squad", label: string, href: string) => (
    <Link
      href={href}
      replace
      scroll={false}
      aria-current={tab === key ? "page" : undefined}
      className={cn(
        "flex-1 rounded-full px-5 py-2.5 text-center font-heading text-label font-bold transition",
        tab === key ? "bg-surface text-accent-strong shadow-raised" : "text-text-muted",
      )}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Home view" className={cn("flex rounded-full bg-accent-tint/70 p-1 shadow-inset", className)}>
      {item("space", "My Space", "/home")}
      {item("squad", "Squad Room", "/home?tab=squad")}
    </nav>
  );
}

/** Section 02 · Home: My Space, Squad Room, first day and quiet-day states. */
export function HomeScreen({ today }: { today: UseTodayResult }) {
  const params = useSearchParams();
  const router = useRouter();
  const { openQuickCreate, showToast } = useShell();
  const { greeting, kicker } = useGreetingLine();
  const name = useDisplayName();
  const notifications = useNotifications();
  const squad = useSquad();
  const [reaction, setReaction] = useState<CompanionReaction>("hello");
  const [dismissedQuiet, setDismissedQuiet] = useState(false);

  const tab = params.get("tab") === "squad" ? "squad" : "space";
  const create = params.get("create");

  useEffect(() => {
    if (create === "task" || create === "habit" || create === "goal" || create === "focus") {
      openQuickCreate(create);
      router.replace(tab === "squad" ? "/home?tab=squad" : "/home", { scroll: false });
    }
  }, [create, openQuickCreate, router, tab]);

  const { data } = today;
  const isEmpty = data ? data.tasks.length === 0 && data.habits.length === 0 : false;
  const mode: HomeMode =
    params.get("welcome") === "1" || isEmpty
      ? "first"
      : params.get("state") === "quiet" && !dismissedQuiet
        ? "quiet"
        : "normal";

  const completeTask = useCallback(
    async (id: string) => {
      await today.completeTask(id);
      setReaction("taskDone");
      showToast("Nice. Ari felt that one.");
    },
    [today, showToast],
  );

  const incrementHabit = useCallback(
    async (id: string) => {
      await today.incrementHabit(id);
      setReaction("taskDone");
    },
    [today],
  );

  const onReactionEnd = useCallback(() => setReaction("idle"), []);
  const sayHello = useCallback(() => setReaction("hello"), []);

  const tasks = data?.tasks ?? [];
  const nextTask = tasks.find((task) => !task.isDone) ?? null;
  const remaining = tasks.filter((task) => !task.isDone).length;
  const heroMessage =
    remaining === 0 ? "All done today. I'm proud of you." : remaining <= 2 ? `${remaining === 1 ? "One more" : "Two more"} and today is done. I'm with you.` : "One thing at a time. I'm with you.";

  const startFocus = () => router.push(nextTask ? `/focus?task=${encodeURIComponent(nextTask.id)}` : "/focus");

  const title =
    tab === "squad"
      ? "Your people, your pace."
      : mode === "first"
        ? "Hi, I'm Ari. Let's start small."
        : mode === "quiet"
          ? "Quiet days count too."
          : `${greeting}, ${name}.`;
  const headerKicker =
    tab === "squad" ? squad.squadName ? `${squad.squadName} · ${squad.data?.members.length ?? 0} members` : "Squad Room" : mode === "first" ? "Day 1 · Welcome" : mode === "quiet" ? "My Space · Quiet day" : kicker;

  const companion = data?.companion;
  const hero = companion ? (
    mode === "first" ? (
      <CompanionHero
        stage="child"
        xp={0}
        xpToNextStage={companion.stage === "child" ? companion.xpToNextStage : 100}
        message="Pick one thing for today?"
        reaction={reaction}
        onTap={sayHello}
        onReactionEnd={onReactionEnd}
      />
    ) : (
      <CompanionHero
        stage={companion.stage}
        xp={companion.xp}
        xpToNextStage={companion.xpToNextStage}
        message={mode === "quiet" ? "Want to do one tiny thing?" : heroMessage}
        reaction={mode === "quiet" && reaction === "idle" ? "quietDay" : reaction}
        onTap={sayHello}
        onReactionEnd={onReactionEnd}
      />
    )
  ) : (
    <Skeleton className="h-[460px] rounded-[32px]" />
  );

  const desktopHero = companion && mode === "normal" ? (
    <CompanionHero
      variant="desktop"
      stage={companion.stage}
      xp={companion.xp}
      xpToNextStage={companion.xpToNextStage}
      message={heroMessage}
      reaction={reaction}
      onTap={sayHello}
      onReactionEnd={onReactionEnd}
    />
  ) : (
    hero
  );

  let body: ReactNode;
  if (tab === "squad" && squad.isLoading) {
    body = <Skeleton className="h-52 rounded-[28px]" />;
  } else if (tab === "squad" && squad.error) {
    body = <p role="alert" className="rounded-card bg-surface p-5 font-heading text-body text-warning">Unable to load your squad. Refresh to retry.</p>;
  } else if (tab === "squad" && !squad.data?.hasSquad) {
    body = <div className="rounded-card bg-surface p-6 shadow-raised"><h2 className="font-display text-heading font-extrabold">Your Squad Room is waiting</h2><p className="mt-2 font-heading text-body text-text-muted">Create or join a squad when you are ready.</p><Link href="/onboarding/join" className="mt-4 inline-block font-heading font-bold text-accent-strong">Create or join a squad</Link></div>;
  } else if (tab === "squad") {
    body = (
      <SquadRoom
        members={squad.data?.members ?? []}
        sharedTask={tasks.find((task) => task.isShared) ?? null}
        onCompleteShared={(id) => void completeTask(id)}
        onShare={() => openQuickCreate("task")}
        onCheer={(cheer) => showToast(`Sent: “${cheer}”`)}
      />
    );
  } else if (!data) {
    body = (
      <div className="flex flex-col gap-4" aria-busy>
        <Skeleton className="h-24 rounded-[28px]" />
        <Skeleton className="h-56 rounded-[28px]" />
      </div>
    );
  } else if (mode === "first") {
    body = (
      <FirstDayActions
        onAddTask={() => openQuickCreate("task")}
        onAddHabit={() => openQuickCreate("habit")}
        onDirection={() => router.push("/growth")}
      />
    );
  } else if (mode === "quiet") {
    body = (
      <>
        <section className="rounded-[28px] bg-surface p-5 shadow-raised">
          <p className="font-heading text-meta font-bold tracking-wide text-accent uppercase">Ari missed you</p>
          <p className="mt-1 font-display text-heading font-extrabold text-text">Want to do one tiny thing?</p>
          <p className="mt-1 font-heading text-label text-text-muted">
            Or just say hi. Ari&apos;s growth is exactly where you left it.
          </p>
        </section>
        <QuietDayActions
          onWater={() => {
            const water = data.habits.find((habit) => habit.icon === "water");
            if (water) void incrementHabit(water.id);
            setDismissedQuiet(true);
          }}
          onTask={() => setDismissedQuiet(true)}
          onCheckIn={() => router.push("/check-in")}
          onSayHi={() => {
            sayHello();
            setDismissedQuiet(true);
          }}
          onNotToday={() => showToast("That's okay. Ari will be here.")}
        />
      </>
    );
  } else {
    body = (
      <>
        <UpNextCard task={nextTask} onStart={startFocus} />
        <PrioritiesCard tasks={tasks} onComplete={(id) => void completeTask(id)} onAdd={() => openQuickCreate("task")} />
        <HabitsCard habits={data.habits} onIncrement={(id) => void incrementHabit(id)} />
        <p className="py-2 text-center font-heading text-label text-text-muted">Grow on your own. Go further together.</p>
      </>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pt-7 pb-36 sm:px-8 md:pt-10 md:pb-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-heading text-meta font-bold tracking-widest text-accent-strong uppercase">{headerKicker}</p>
          <h1 className="mt-1 font-display text-display font-extrabold text-text">{title}</h1>
          {tab === "space" && mode === "quiet" ? (
            <p className="mt-1 font-heading text-body text-text-muted">You haven&apos;t checked in for 3 days. That&apos;s okay.</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <SpaceToggle tab={tab} className="hidden w-[300px] md:flex" />
          <BellLink unread={notifications.unreadCount} />
        </div>
      </header>

      <SpaceToggle tab={tab} className="mt-5 md:hidden" />
      <p role="status" className="mt-4 rounded-card bg-surface p-3 font-heading text-meta text-text-muted">Preview content: tasks, habits, growth XP, activity and focus indicators below are examples, not saved account data. Your name and squad membership are loaded from your account.</p>

      {tab === "squad" ? (
        <div className="mx-auto mt-6 max-w-[640px]">{body}</div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
          <div className="lg:hidden">{hero}</div>
          <div className="hidden lg:sticky lg:top-6 lg:block">{desktopHero}</div>
          <div className="flex flex-col gap-5">
            {body}
            {mode === "normal" && data ? (
              <div className="hidden flex-col gap-5 lg:flex">
                <GrowthStudioCard />
                <MyProgressCard />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
