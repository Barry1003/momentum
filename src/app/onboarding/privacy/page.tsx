"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, CheckOrb, ListCard, ListCardRow, ScreenHeader } from "@/frontend/components";
import meIcon from "@/frontend/assets/icons/me.svg";
import playIcon from "@/frontend/assets/icons/play.svg";

const ONLY_YOU = ["Tasks, goals and notes", "Check-ins and reflections", "Life Audit answers"];

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-[18px]">
      <ScreenHeader kicker="Step 5 of 5" title="Your space. Your choice." onBack={() => router.back()} />
      <p className="font-heading text-body text-text-muted">A few things worth knowing before you begin.</p>

      <ListCard groupTitle="Only you">
        {ONLY_YOU.map((label) => (
          <ListCardRow key={label} leading={<CheckOrb label={label} size="sm" defaultChecked disabled />} title={label} />
        ))}
      </ListCard>

      <ListCard groupTitle="Only if you say so">
        <ListCardRow
          leading={
            <span className="flex h-9 w-9 items-center justify-center rounded-chip bg-accent-tint">
              <Image src={meIcon} alt="" className="h-[18px] w-[18px]" />
            </span>
          }
          title="Checked in today"
          meta="To your squad"
        />
        <ListCardRow
          leading={
            <span className="flex h-9 w-9 items-center justify-center rounded-chip bg-accent-tint">
              <Image src={playIcon} alt="" className="h-[18px] w-[18px]" />
            </span>
          }
          title="Focusing now"
          meta="To your squad"
        />
      </ListCard>

      <div className="flex flex-col gap-2.5">
        <Button variant="primary" onClick={() => router.push("/onboarding/path")}>
          Got it
        </Button>
        <Button variant="secondary">Privacy details</Button>
      </div>
    </div>
  );
}
