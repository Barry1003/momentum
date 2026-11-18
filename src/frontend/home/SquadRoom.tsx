"use client";

import Image from "next/image";
import { useState } from "react";
import ariYoungAdult from "../assets/companion/ari-youngAdult.png";
import malikFace from "../assets/faces/malik-face.png";
import malikFull from "../assets/faces/malik-full.png";
import zaraFace from "../assets/faces/zara-face.png";
import zaraFull from "../assets/faces/zara-full.png";
import { CheckOrb, FaceAvatar } from "../components";
import { cn } from "../lib/cn";
import type { SquadMember, Task } from "../mocks/types";
import { PlusIcon, SparkleIcon } from "./icons";

const FACES: Record<string, typeof zaraFace> = { Zara: zaraFace, Malik: malikFace };

const SHARED_TODAY = [
  { id: "s-1", who: "Zara", title: "45 min deep work", meta: "Done at 10:40 · contributed to the goal", done: true },
  { id: "s-2", who: "Ari", title: "Walk for 20 minutes", meta: "Wellness · visible to Northstar", done: false },
  { id: "s-3", who: "Kemi", title: "Finish chapter 3", meta: "Reading · due tonight", done: false },
];

const CHEERS = ["High five, Zara", "You got this, Kemi", "Proud of you"];

const ACTIVITY = [
  { id: "a-1", name: "Zara", text: "Zara reached 20 reading sessions", when: "2h" },
  { id: "a-2", name: "Dayo", text: "Dayo grew to Young Adult", when: "Yesterday" },
];

function memberStatus(member: SquadMember): string {
  if (member.isFocusing) return "Focusing";
  if (member.isCheckedInToday) return "Checked in";
  return "Resting";
}

/** A squad member standing in their own nook on the shared stage. */
function MemberNook({ member, art, nook }: { member: SquadMember; art: typeof zaraFull; nook: string }) {
  return (
    <figure className="relative flex flex-col items-center">
      <div className={cn("relative h-52 w-full overflow-hidden rounded-[20px] shadow-raised", nook)}>
        <Image src={art} alt={member.name} fill sizes="120px" className="object-contain object-bottom" />
      </div>
      <span
        className={cn(
          "relative -mt-3 rounded-full px-2.5 py-1 font-heading text-meta font-bold shadow-raised",
          member.isFocusing ? "bg-success-tint text-success" : "bg-surface text-text-muted",
        )}
      >
        ● {memberStatus(member)}
      </span>
      <figcaption className="relative mt-1 font-heading text-label font-bold text-text">{member.name}</figcaption>
    </figure>
  );
}

export interface SquadRoomProps {
  members: SquadMember[];
  sharedTask: Task | null;
  onCompleteShared: (id: string) => void;
  onShare: () => void;
  onCheer: (message: string) => void;
}

/** Section 02 · Home — Squad Room tab. Shared, never ranked. */
export function SquadRoom({ members, sharedTask, onCompleteShared, onShare, onCheer }: SquadRoomProps) {
  const [sent, setSent] = useState<string | null>(null);
  const focusing = members.filter((member) => member.isFocusing).length + 1;
  const zara = members.find((member) => member.name === "Zara");
  const malik = members.find((member) => member.name === "Malik");
  const others = members.filter((member) => member !== zara && member !== malik);

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-labelledby="squad-stage"
        className="rounded-[32px] bg-[linear-gradient(160deg,#f6eee4,#efe6fb)] p-4 shadow-floating"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="squad-stage" className="font-display text-heading font-extrabold text-text">
              A place to grow together.
            </h2>
            <p className="flex items-center gap-1.5 font-heading text-label text-text-muted">
              <span className="h-2 w-2 rounded-full bg-success" />
              {focusing} focusing right now
            </p>
          </div>
          <span className="rounded-full bg-surface px-3 py-1.5 font-heading text-label font-bold text-text shadow-raised">
            All {members.length + 1}
          </span>
        </div>

        <div className="relative mt-4 grid grid-cols-3 items-end gap-2 pb-6">
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-10 rounded-[50%] bg-[#d9ccf6] shadow-[0_6px_0_#b9a3f0]" />
          {zara ? <MemberNook member={zara} art={zaraFull} nook="bg-[#fef3e1]" /> : null}
          <figure className="relative flex flex-col items-center">
            <div className="relative h-52 w-full overflow-hidden rounded-[20px] bg-accent-tint ring-2 ring-accent shadow-raised">
              <Image src={ariYoungAdult} alt="Your companion Ari" fill sizes="120px" className="object-contain object-bottom" />
            </div>
            <span className="relative -mt-3 rounded-full bg-surface px-2.5 py-1 font-heading text-meta font-bold text-accent-strong shadow-raised">
              ● 2 of 3
            </span>
            <figcaption className="relative mt-1 font-heading text-label font-bold text-text">Ari (you)</figcaption>
          </figure>
          {malik ? <MemberNook member={malik} art={malikFull} nook="bg-[#fdf9f2]" /> : null}
        </div>
        {others.length ? (
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="flex -space-x-2">
              {others.map((member) => (
                <FaceAvatar key={member.id} name={member.name} size={28} />
              ))}
            </span>
            <span className="font-heading text-label font-bold text-text">
              +{others.length} more · {others.map((member) => member.name).join(", ")}
            </span>
          </div>
        ) : null}
        <p className="mt-2 font-heading text-meta text-text-muted">Everyone moves at their own pace. No rankings.</p>
      </section>

      <section className="rounded-[28px] bg-surface p-5 shadow-raised">
        <p className="font-heading text-meta font-bold tracking-wide text-accent uppercase">Our shared goal</p>
        <p className="mt-1 font-display text-heading font-extrabold text-text">Make space for 30 focus hours</p>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-accent-tint shadow-inset" aria-hidden>
          <span className="w-[18%] bg-[#b9a3f0]" />
          <span className="w-[24%] bg-accent" />
          <span className="w-[18%] bg-[#f0a98a]" />
        </div>
        <div className="mt-2 flex justify-between font-heading text-label font-bold">
          <span className="text-text">18 of 30 hours together</span>
          <span className="text-accent-strong">60%</span>
        </div>
        <p className="mt-1 font-heading text-meta text-text-muted">
          Every session counts. Colours show who added time, not who is ahead.
        </p>
      </section>

      <section aria-labelledby="shared-today">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 id="shared-today" className="font-display text-heading font-extrabold text-text">
              Shared today
            </h2>
            <p className="font-heading text-label text-text-muted">Commitments the squad can see</p>
          </div>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1 rounded-full bg-accent-tint px-3.5 py-2 font-heading text-label font-bold text-accent-strong"
          >
            <PlusIcon className="h-4 w-4" /> Share
          </button>
        </div>
        <ul className="flex flex-col gap-3">
          {SHARED_TODAY.map((item) => {
            const isMine = item.who === "Ari" && sharedTask;
            const done = isMine ? sharedTask.isDone : item.done;
            return (
              <li key={item.id} className="flex items-center gap-3 rounded-[22px] bg-surface p-3.5 shadow-raised">
                <CheckOrb
                  id={`shared-${item.id}`}
                  size="sm"
                  label={`${item.who}: ${item.title}`}
                  checked={done}
                  disabled={!isMine || done}
                  onChange={() => (isMine ? onCompleteShared(sharedTask.id) : undefined)}
                />
                <div className="min-w-0">
                  <p className="font-heading text-body font-bold text-text">
                    {item.who} · {item.title}
                  </p>
                  <p className="font-heading text-meta text-text-muted">{item.meta}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="cheer">
        <h2 id="cheer" className="font-display text-heading font-extrabold text-text">
          Cheer someone on
        </h2>
        <p className="font-heading text-label text-text-muted">One tap. They will see it on their stage.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CHEERS.map((cheer, index) => (
            <button
              key={cheer}
              type="button"
              aria-pressed={sent === cheer}
              onClick={() => {
                setSent(cheer);
                onCheer(cheer);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 font-heading text-label font-bold shadow-raised transition active:translate-y-0.5",
                index === 0 || sent === cheer ? "bg-[image:var(--gradient-primary)] text-white" : "bg-surface text-accent-strong",
              )}
            >
              <SparkleIcon className="h-4 w-4" />
              {cheer}
            </button>
          ))}
        </div>
      </section>

      <ul className="divide-y divide-outline rounded-[24px] bg-surface/80 px-4 shadow-raised">
        {ACTIVITY.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3">
            <FaceAvatar name={item.name} src={FACES[item.name]} size={28} />
            <p className="flex-1 font-heading text-label text-text">{item.text}</p>
            <span className="font-heading text-meta text-text-muted">{item.when}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
