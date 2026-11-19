"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import malikFace from "../assets/faces/malik-face.png";
import zaraFace from "../assets/faces/zara-face.png";
import { STAGE_ART } from "../companion";
import { CheckOrb, Skeleton } from "../components";
import { AriTile, Split } from "../habits/views";
import { useShell } from "../home/AppShell";
import { GROWTH_STAGES, stageIndex } from "../home/growth";
import { useToday } from "../hooks";
import { cn } from "../lib/cn";
import { getStudio, saveLook } from "../mocks/repository";
import type { StudioOption, StudioState } from "../mocks/types";
import { Badge, Panel, Pill, SubHeader } from "../planner/parts";
import { STAGE_THRESHOLDS } from "../mocks/progressRules";

type Tab = "rooms" | "accents" | "outfits" | "extras";
const TABS: { tab: Tab; label: string }[] = [
  { tab: "rooms", label: "Rooms" },
  { tab: "accents", label: "Accents" },
  { tab: "outfits", label: "Outfits" },
  { tab: "extras", label: "Extras" },
];

const STATUS: Record<StudioOption["status"], { label: string; className: string }> = {
  selected: { label: "Selected", className: "bg-accent-tint text-accent-strong" },
  available: { label: "Preview", className: "bg-accent-tint text-accent-strong" },
  earned: { label: "Earned", className: "bg-success-tint text-success" },
  locked: { label: "Locked", className: "bg-[#fbeedd] text-[#9a5b12]" },
  soon: { label: "Soon", className: "bg-[#fbeedd] text-[#9a5b12]" },
};

const STYLE_FACES: Record<string, typeof zaraFace | null> = { "anime-girl": zaraFace, "anime-bold": malikFace, "soft-boy": null, "soft-girl": null };

const ROOM_LINES: Record<string, string> = {
  lavender: "Ari stays Ari. Rooms and accents change the space around him.",
  sage: "Calm green walls, a plant, and a little desk lamp.",
  sunrise: "Warm morning light through a big window.",
};

const ARI_THANKS: Record<string, string> = {
  lavender: "Back home. I like it here.",
  sage: "Oh, I like the plant. Thanks!",
  sunrise: "So much light. Good morning!",
};

function studioHref(tab: Tab, extra = ""): string {
  return `/me/studio?tab=${tab}${extra ? `&${extra}` : ""}`;
}

/** Figma 07b · Me · Character Studio. A look never changes the growth stage or XP. */
export function StudioScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { showToast } = useShell();
  const today = useToday();
  const [studio, setStudio] = useState<StudioState | null>(null);
  const [draft, setDraft] = useState<{ plinth: string; name: string } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void getStudio().then((result) => {
      if (alive) setStudio(result);
    });
    return () => {
      alive = false;
    };
  }, []);

  const tabParam = params.get("tab");
  const tab = TABS.some((item) => item.tab === tabParam) ? (tabParam as Tab) : null;
  const previewId = params.get("preview");
  const appliedId = params.get("applied");
  const stage = today.data?.companion.stage ?? "teen";
  const art = STAGE_ART[stage];
  const index = stageIndex(stage);

  if (!studio) {
    return (
      <Main>
        <Skeleton className="h-96 rounded-[28px]" />
      </Main>
    );
  }

  const current = studio;
  const plinth = draft?.plinth ?? current.plinth;
  const name = draft?.name ?? current.name;
  const plinthColor = current.plinths.find((item) => item.id === plinth)?.color ?? "#f8f0e2";
  const roomLabel = (id: string) => current.rooms.find((room) => room.id === id)?.label ?? id;

  async function apply(changes: Parameters<typeof saveLook>[0], then?: () => void) {
    try {
      setStudio(await saveLook(changes));
      setError(null);
      then?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t save that look.");
    }
  }

  const tabs = (active: Tab) => (
    <nav aria-label="Studio sections" className="flex flex-wrap gap-2">
      {TABS.map((item) => (
        <Link key={item.tab} href={studioHref(item.tab)} scroll={false} aria-current={item.tab === active ? "page" : undefined}>
          <Pill selected={item.tab === active}>{item.label}</Pill>
        </Link>
      ))}
    </nav>
  );

  // ---------------------------------------------------------------- applied
  if (appliedId) {
    return (
      <Main>
        <SubHeader backHref={studioHref("rooms")} backLabel="Back to rooms" kicker="Character Studio" title="That feels like home." subtitle={`${roomLabel(appliedId)} is now ${current.name}’s room.`} />
        <Split
          left={
            <>
              <AriTile art={art.full} label="Look applied" title={roomLabel(appliedId)} body="You can change it back anytime.">
                <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">Saved</span>
              </AriTile>
              <div className="flex items-center gap-3">
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-cream ring-[3px] ring-white">
                  <Image src={art.face} alt="" width={44} height={44} className="h-full w-full object-cover" />
                </span>
                <p className="rounded-[18px] rounded-tl-md bg-surface px-4 py-3 font-heading text-body text-text shadow-raised">{ARI_THANKS[appliedId] ?? "Thanks! I love it."}</p>
              </div>
            </>
          }
          right={
            <>
              <Link href="/me" className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable">
                Done
              </Link>
              <Link href={studioHref("rooms")} className="w-full rounded-full bg-surface py-4 text-center font-heading text-body font-bold text-accent-strong shadow-raised">
                Keep customising
              </Link>
            </>
          }
        />
      </Main>
    );
  }

  // ---------------------------------------------------------------- preview / coming later
  if (tab && previewId) {
    const list = tab === "rooms" ? current.rooms : tab === "accents" ? current.accents : tab === "outfits" ? current.outfits : current.extras;
    const item = list.find((entry) => entry.id === previewId);
    if (item && item.status === "soon") {
      return (
        <Main>
          <SubHeader backHref={studioHref(tab)} backLabel="Back" kicker="Character Studio" title={`${item.label} is coming later.`} subtitle="It isn’t ready yet. Nothing to unlock or buy." />
          <Split
            left={
              <>
                <section className="rounded-[22px] bg-[#fbf1e1] p-4">
                  <p className="font-heading text-body font-bold text-accent-strong">Coming later</p>
                  <p className="mt-1 font-heading text-label text-text">We’ll let you know when it arrives. Your current look stays as it is.</p>
                </section>
                {tabs(tab)}
              </>
            }
            right={
              <Link href={studioHref(tab)} className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 text-center font-heading text-body font-bold text-white shadow-pressable">
                Back to {tab}
              </Link>
            }
          />
        </Main>
      );
    }
    if (item && tab === "rooms" && item.status === "available") {
      return (
        <Main>
          <SubHeader backHref={studioHref("rooms")} backLabel="Back to rooms" kicker="Character Studio · Preview" title={`Try ${item.label}?`} subtitle="Preview only. Nothing changes until you save." />
          <Split
            left={
              <>
                <AriTile art={art.full} label="Preview · Unsaved" title={item.label} body={ROOM_LINES[item.id] ?? item.detail}>
                  <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">Preview</span>
                </AriTile>
                {tabs("rooms")}
              </>
            }
            right={
              <>
                <button
                  type="button"
                  onClick={() => void apply({ room: item.id }, () => router.push(studioHref("rooms", `applied=${item.id}`)))}
                  className="w-full rounded-full bg-[image:var(--gradient-primary)] py-4 font-heading text-body font-bold text-white shadow-pressable"
                >
                  Use this room
                </button>
                <Link href={studioHref("rooms")} className="w-full rounded-full bg-surface py-4 text-center font-heading text-body font-bold text-accent-strong shadow-raised">
                  Back to {roomLabel(current.room)}
                </Link>
                <p className="rounded-[20px] bg-accent-tint p-4 font-heading text-label text-text">Your squad sees your new room in the Squad Room only if room sharing is on.</p>
              </>
            }
          />
        </Main>
      );
    }
  }

  // ---------------------------------------------------------------- a tab
  if (tab) {
    const list = tab === "rooms" ? current.rooms : tab === "accents" ? current.accents : tab === "outfits" ? current.outfits : current.extras;
    const titles: Record<Tab, [string, string, string]> = {
      rooms: ["Character Studio · Rooms", "Make room for you.", "A familiar friend, in a space that feels like yours."],
      accents: ["Character Studio · Accents", "Little things around Ari.", "Small touches for the room. Add or remove any time."],
      outfits: ["Character Studio · Outfits", "Same Ari, new layers.", "Ari’s original look is always one tap away."],
      extras: ["Character Studio · Extras", "Earned along the way.", "Extras come from growing, never from buying."],
    };
    const [kicker, title, subtitle] = titles[tab];
    return (
      <Main>
        <SubHeader backHref="/me/studio" backLabel="Back to studio" kicker={kicker} title={title} subtitle={subtitle} />
        <Split
          left={
            <>
              {tab === "rooms" ? (
                <AriTile art={art.full} label="Current look" title={roomLabel(current.room)} body={ROOM_LINES[current.room] ?? ""}>
                  <span className="mt-3 w-max rounded-full bg-surface px-3 py-1 font-heading text-meta text-text shadow-raised">Selected</span>
                </AriTile>
              ) : null}
              {tabs(tab)}
              {tab === "outfits" ? (
                <AriTile art={art.full} label="Identity stays" title="Hair, face and style never change." body={`Outfits are layers on top. ${current.name} is still the friend you picked.`} />
              ) : null}
            </>
          }
          right={
            <>
              <Panel title={TABS.find((item) => item.tab === tab)?.label}>
                <ul className="divide-y divide-outline">
                  {list.map((item) => {
                    const status = STATUS[item.status];
                    const canToggleAccent = tab === "accents" && (item.status === "available" || item.status === "selected");
                    const href =
                      tab === "rooms" && item.status === "available"
                        ? studioHref("rooms", `preview=${item.id}`)
                        : item.status === "soon"
                          ? studioHref(tab, `preview=${item.id}`)
                          : null;
                    const content = (
                      <>
                        {tab === "outfits" && item.id === "original" ? (
                          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-cream ring-2 ring-white">
                            <Image src={art.face} alt="" width={36} height={36} className="h-full w-full object-cover" />
                          </span>
                        ) : (
                          <CheckOrb id={`opt-${tab}-${item.id}`} size="sm" label={item.label} checked={item.status === "selected"} disabled onChange={() => undefined} />
                        )}
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block font-heading text-body font-bold text-text">{item.label}</span>
                          <span className="block font-heading text-meta text-text-muted">{item.detail}</span>
                        </span>
                        <span className={cn("rounded-full px-3 py-1 font-heading text-meta font-bold", status.className)}>
                          {tab === "outfits" && item.status === "selected" ? "Wearing" : canToggleAccent ? (item.status === "selected" ? "Added" : "Add") : status.label}
                        </span>
                      </>
                    );
                    return (
                      <li key={item.id}>
                        {href ? (
                          <Link href={href} className="flex items-center gap-3 py-3">
                            {content}
                          </Link>
                        ) : canToggleAccent ? (
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 py-3"
                            onClick={() => {
                              const selected = current.accents.filter((entry) => entry.status === "selected").map((entry) => entry.id);
                              const next = selected.includes(item.id) ? selected.filter((id) => id !== item.id) : [...selected, item.id];
                              void apply({ accents: next }, () => showToast(selected.includes(item.id) ? `${item.label} removed.` : `${item.label} added.`));
                            }}
                          >
                            {content}
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 py-3">{content}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Panel>
              <p className="rounded-[20px] bg-accent-tint p-4 font-heading text-label text-text">Nothing here costs anything or expires. Some things unlock as {current.name} grows.</p>
            </>
          }
        />
      </Main>
    );
  }

  // ---------------------------------------------------------------- studio home
  const dirty = Boolean(draft && (draft.plinth !== current.plinth || draft.name !== current.name));
  const unlockedExtras = current.extras.filter((item) => item.status === "earned").length;

  return (
    <Main>
      <header>
        <p className="font-heading text-meta font-bold tracking-widest text-text-muted uppercase">Me · Character Studio</p>
        <h1 className="mt-1 font-display text-display font-extrabold text-text">Make {current.name} yours.</h1>
      </header>
      <Split
        left={
          <>
            <section className="relative flex h-[380px] items-end justify-center overflow-hidden rounded-[30px] bg-[linear-gradient(160deg,#f9f2e5,#efe7fb)] shadow-floating">
              <span className="absolute top-4 left-4 rounded-full bg-surface px-3 py-1.5 font-heading text-meta font-bold text-accent-strong shadow-raised">
                {GROWTH_STAGES[index]?.label} · Stage {index + 1} of 5
              </span>
              {dirty ? <span className="absolute top-4 right-4 rounded-full bg-[image:var(--gradient-primary)] px-3 py-1.5 font-heading text-meta font-bold text-white shadow-pressable">Previewing</span> : null}
              <span aria-hidden className="absolute bottom-6 h-14 w-64 rounded-[50%] shadow-[0_10px_0_#b9a3f0]" style={{ background: plinthColor }} />
              <Image src={art.full} alt={`${current.name} as a ${GROWTH_STAGES[index]?.label}`} className="relative mb-10 h-[300px] w-auto" priority />
            </section>
            <section>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="font-heading text-body font-bold text-text">Your stages</h2>
                <span className="font-heading text-meta text-text-muted">Growth is earned, never lost</span>
              </div>
              <ul className="grid grid-cols-5 gap-2">
                {GROWTH_STAGES.map((item, position) => (
                  <li
                    key={item.stage}
                    className={cn(
                      "relative flex h-24 items-end justify-center overflow-hidden rounded-[16px] bg-[#f6efe4]",
                      position === index ? "ring-2 ring-accent" : "",
                    )}
                    title={position <= index ? item.label : `${item.label} · ${STAGE_THRESHOLDS[position]?.from.toLocaleString("en-GB")} XP`}
                  >
                    <Image src={STAGE_ART[item.stage].full} alt={position <= index ? item.label : `${item.label}, still ahead`} className={cn("h-20 w-auto", position > index ? "opacity-35 grayscale" : "")} />
                    {position > index ? (
                      <span className="absolute top-1 rounded-full bg-surface px-1.5 font-heading text-[10px] text-text-muted">
                        {STAGE_THRESHOLDS[position]?.from.toLocaleString("en-GB")} XP
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          </>
        }
        right={
          <>
            <section>
              <h2 className="mb-2 font-heading text-body font-bold text-text">Art style</h2>
              <ul className="grid grid-cols-3 gap-2">
                {current.styles.map((item) => {
                  const face = item.id === "anime-boy" ? art.face : STYLE_FACES[item.id];
                  return (
                    <li
                      key={item.id}
                      className={cn("flex flex-col items-center gap-1.5 rounded-[20px] bg-surface p-3 text-center shadow-raised", item.status === "selected" ? "outline outline-2 outline-accent" : "")}
                    >
                      <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-cream">
                        {face ? <Image src={face} alt="" width={56} height={56} className="h-full w-full object-cover" /> : <span className="font-heading text-meta text-text-muted">3D</span>}
                      </span>
                      <span className={cn("font-heading text-meta", item.status === "selected" ? "font-bold text-accent-strong" : "text-text")}>{item.label}</span>
                      {item.status === "soon" ? <span className="font-heading text-[11px] text-text-muted">Coming later</span> : null}
                    </li>
                  );
                })}
              </ul>
            </section>
            <section>
              <h2 className="mb-2 font-heading text-body font-bold text-text">Stage colour</h2>
              <div role="radiogroup" aria-label="Stage colour" className="flex gap-3">
                {current.plinths.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={plinth === item.id}
                    aria-label={item.label}
                    onClick={() => setDraft({ plinth: item.id, name })}
                    className={cn("h-11 w-11 rounded-full shadow-raised", plinth === item.id ? "ring-[3px] ring-accent ring-offset-2" : "")}
                    style={{ background: item.color }}
                  />
                ))}
              </div>
            </section>
            <section>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="font-heading text-body font-bold text-text">Earned extras</h2>
                <Link href={studioHref("extras")} className="font-heading text-meta text-text-muted">
                  {unlockedExtras} of {current.extras.length} unlocked
                </Link>
              </div>
              <ul className="grid grid-cols-4 gap-2">
                {current.extras.map((item) => (
                  <li key={item.id} className={cn("flex flex-col items-center gap-1 rounded-[18px] p-2.5 text-center shadow-raised", item.status === "earned" ? "bg-success-tint" : "bg-surface")}>
                    <span className={cn("h-9 w-9 rounded-full", item.status === "earned" ? "bg-[radial-gradient(circle_at_35%_30%,#dff5ec,#5fbf98)]" : "bg-[radial-gradient(circle_at_35%_30%,#fff,#d8cff0)]")} />
                    <span className="font-heading text-meta text-text">{item.label}</span>
                    <span className={cn("font-heading text-[11px]", item.status === "earned" ? "text-success" : "text-text-muted")}>{item.status === "earned" ? "Unlocked" : item.unlock}</span>
                  </li>
                ))}
              </ul>
            </section>
            <div className="flex flex-wrap gap-2">
              {TABS.map((item) => (
                <Link key={item.tab} href={studioHref(item.tab)}>
                  <Pill selected={false}>{item.label}</Pill>
                </Link>
              ))}
            </div>
            <section className="flex items-center justify-between gap-3 rounded-[22px] bg-surface px-5 py-4 shadow-raised">
              <label className="min-w-0 flex-1">
                <span className="block font-heading text-meta text-text-muted">Companion name</span>
                {editingName ? (
                  <input
                    value={name}
                    maxLength={20}
                    onChange={(event) => setDraft({ plinth, name: event.target.value })}
                    className="mt-1 w-full rounded-full bg-accent-tint/40 px-3 py-1 font-heading text-body text-text shadow-inset"
                  />
                ) : (
                  <span className="block font-heading text-body text-text">{name}</span>
                )}
              </label>
              <button type="button" onClick={() => setEditingName((value) => !value)} className="font-heading text-label font-bold text-accent-strong">
                {editingName ? "Done" : "Edit"}
              </button>
            </section>
            {error ? (
              <p role="alert" className="font-heading text-label text-warning">
                {error}
              </p>
            ) : null}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={!dirty}
                onClick={() => {
                  setDraft(null);
                  setEditingName(false);
                }}
                className="flex-1 rounded-full bg-surface py-4 font-heading text-body font-bold text-text-muted shadow-raised disabled:opacity-60"
              >
                Reset
              </button>
              <button
                type="button"
                disabled={!dirty}
                onClick={() =>
                  void apply({ plinth, name }, () => {
                    setDraft(null);
                    setEditingName(false);
                    showToast("Saved. Same growth, new look.");
                  })
                }
                className="flex-1 rounded-full bg-[image:var(--gradient-primary)] py-4 font-heading text-body font-bold text-white shadow-pressable disabled:opacity-60"
              >
                Save changes
              </button>
            </div>
            <Badge>Changing look or style never changes your growth stage or XP.</Badge>
          </>
        }
      />
    </Main>
  );
}

function Main({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pt-7 pb-36 sm:px-8 md:pt-10 md:pb-16">
      {children}
      <p role="status" className="mt-6 font-heading text-meta text-text-muted">
        Preview: looks and unlocks here are examples, not saved account data yet.
      </p>
    </main>
  );
}
