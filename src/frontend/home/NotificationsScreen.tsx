"use client";

import Image from "next/image";
import Link from "next/link";
import ariTeenFace from "../assets/companion/ari-teen-face.png";
import malikFace from "../assets/faces/malik-face.png";
import zaraFace from "../assets/faces/zara-face.png";
import { FaceAvatar, Note, Skeleton } from "../components";
import { useNotifications } from "../hooks";
import { cn } from "../lib/cn";
import type { NotificationItem } from "../mocks/types";
import { BackIcon, CalendarIcon } from "./icons";

const FACES: Record<string, typeof zaraFace> = { Zara: zaraFace, Malik: malikFace };

function Avatar({ item }: { item: NotificationItem }) {
  if (item.kind === "growth") {
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-cream shadow-raised ring-[3px] ring-white">
        <Image src={ariTeenFace} alt="" width={44} height={44} className="h-full w-full object-cover" />
      </span>
    );
  }
  if (item.kind === "review") {
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-tint text-accent-strong shadow-raised">
        <CalendarIcon className="h-5 w-5" />
      </span>
    );
  }
  return <FaceAvatar name={item.fromName ?? "Squad"} src={item.fromName ? FACES[item.fromName] : undefined} size={44} />;
}

function Group({ label, items }: { label: string; items: NotificationItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={label}>
      <h2 className="mb-2 font-heading text-meta font-bold tracking-wide text-text-muted uppercase">{label}</h2>
      <ul className="divide-y divide-outline rounded-[28px] bg-surface px-4 shadow-raised">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 py-4">
            <Avatar item={item} />
            <div className="min-w-0 flex-1">
              <p className={cn("font-heading text-body text-text", item.isRead ? "font-medium" : "font-bold")}>{item.title}</p>
              <p className="font-heading text-label text-text-muted">{item.body}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="font-heading text-meta text-text-muted">{item.when}</span>
              {item.isRead ? null : <span aria-label="Unread" className="h-2.5 w-2.5 rounded-full bg-accent" />}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Section 02 · Home — Notifications. */
export function NotificationsScreen() {
  const { items, isLoading, unreadCount, markAllRead } = useNotifications();

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 pt-7 pb-36 sm:px-8 md:pt-10 md:pb-16">
      <Link
        href="/home"
        className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 font-heading text-label font-bold text-text shadow-raised"
      >
        <BackIcon className="h-4 w-4" /> Home
      </Link>
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="font-heading text-meta font-bold tracking-widest text-accent-strong uppercase">Notifications</p>
          <h1 className="mt-1 font-display text-display font-extrabold text-text">A few good things.</h1>
        </div>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={unreadCount === 0}
          className="shrink-0 rounded-full bg-accent-tint px-3.5 py-2 font-heading text-label font-bold text-accent-strong disabled:opacity-50"
        >
          Mark all read
        </button>
      </header>

      <div className="mt-6 flex flex-col gap-6">
        {isLoading ? (
          <Skeleton className="h-64 rounded-[28px]" />
        ) : (
          <>
            <Group label="Today" items={items.filter((item) => item.group === "today")} />
            <Group label="Earlier" items={items.filter((item) => item.group === "earlier")} />
          </>
        )}
        <Note tone="tint">
          Quiet hours are on 22:00–08:00. Anything that arrives then waits here for the morning.
        </Note>
      </div>
    </main>
  );
}
