"use client";

import { useState } from "react";
import {
  AriBubble,
  BottomNav,
  Button,
  Card,
  CheckOrb,
  ChipGroup,
  DayAgenda,
  FaceAvatar,
  Field,
  HaradaGrid,
  HeroPortal,
  ListCard,
  ListCardRow,
  Logo,
  MonthCalendar,
  Note,
  ProgressBar,
  QuadrantBoard,
  RatingOrbs,
  ScreenHeader,
  Sheet,
  Sidebar,
  Skeleton,
  StatsRow,
  Switch,
  Tag,
  Toast,
  WeekStrip,
} from "@/frontend/components";
import { Companion } from "@/frontend/companion";
import type { CompanionReaction, GrowthStage } from "@/frontend/companion";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-outline pb-8">
      <h2 className="font-display text-heading font-extrabold text-text">{title}</h2>
      {children}
    </section>
  );
}

export default function ComponentsPreviewPage() {
  const [singleChip, setSingleChip] = useState<string | null>("today");
  const [multiChip, setMultiChip] = useState<string[]>(["water"]);
  const [switchOn, setSwitchOn] = useState(true);
  const [rating, setRating] = useState<number | null>(3);
  const [selectedDay, setSelectedDay] = useState("2026-11-17");
  const [selectedArea, setSelectedArea] = useState("rest");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [companionStage, setCompanionStage] = useState<GrowthStage>("teen");
  const [companionReaction, setCompanionReaction] = useState<CompanionReaction>("idle");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 pt-10 pb-40">
      <ScreenHeader kicker="Dev preview" title="Shared components" subtitle="Every component from the Momentum design system." />

      <Section title="Logo">
        <Logo />
      </Section>

      <Section title="Card & Note">
        <Card>This is a raised Card.</Card>
        <Note tone="tint" title="Tip">A tinted Note.</Note>
        <Note tone="cream">A cream Note with no title.</Note>
        <Note tone="success" title="Saved">A success Note.</Note>
        <Note tone="warning" title="Offline">A warning Note.</Note>
      </Section>

      <Section title="Button">
        <div className="flex flex-col gap-3 md:flex-row">
          <Button variant="primary">Primary action</Button>
          <Button variant="secondary">Secondary action</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Chip & ChipGroup">
        <ChipGroup
          legend="Quick add"
          mode="single"
          value={singleChip}
          onChange={setSingleChip}
          options={[
            { value: "today", label: "Today" },
            { value: "25min", label: "25 min" },
            { value: "goal", label: "Goal…" },
            { value: "busy", label: "Busy option", busy: true },
          ]}
        />
        <ChipGroup
          legend="Filter"
          mode="multi"
          value={multiChip}
          onChange={setMultiChip}
          options={[
            { value: "water", label: "Water" },
            { value: "shared", label: "Shared" },
            { value: "nodate", label: "No date" },
          ]}
        />
      </Section>

      <Section title="Tag">
        <div className="flex flex-wrap gap-2">
          <Tag tone="tint">Tint</Tag>
          <Tag tone="cream">Cream</Tag>
          <Tag tone="success">Done</Tag>
          <Tag tone="warning">Offline</Tag>
          <Tag tone="white">Shared</Tag>
        </div>
      </Section>

      <Section title="Field">
        <Field label="Display name" placeholder="What should Ari call you?" helperText="4 / 24" />
        <Field label="Email" type="email" errorText="That doesn't look like an email address." />
      </Section>

      <Section title="ListCard">
        <ListCard groupTitle="Today">
          <ListCardRow leading={<CheckOrb label="Stretch" size="sm" />} title="Stretch for 5 minutes" meta="8:00 AM" />
          <ListCardRow
            leading={<CheckOrb label="Reply to Zara" size="sm" />}
            title="Reply to Zara's message"
            meta="11:00 AM"
            trailing={<Tag tone="white">Shared</Tag>}
          />
        </ListCard>
      </Section>

      <Section title="Switch">
        <Switch label="Share focus status" checked={switchOn} onChange={(event) => setSwitchOn(event.target.checked)} />
      </Section>

      <Section title="CheckOrb">
        <div className="flex gap-3">
          <CheckOrb label="Task one" defaultChecked />
          <CheckOrb label="Task two" />
        </div>
      </Section>

      <Section title="ProgressBar">
        <ProgressBar label="To Young Adult" value={420} max={600} helperText="180 XP to go" />
      </Section>

      <Section title="StatsRow">
        <StatsRow stats={[{ value: "12", label: "Active days" }, { value: "4h 20m", label: "Focus time" }, { value: "18", label: "Tasks" }]} />
      </Section>

      <Section title="Companion">
        <ChipGroup
          legend="Stage"
          mode="single"
          value={companionStage}
          onChange={(value) => setCompanionStage(value as GrowthStage)}
          options={[
            { value: "child", label: "Child" },
            { value: "preteen", label: "Preteen" },
            { value: "teen", label: "Teen" },
            { value: "youngAdult", label: "Young adult" },
            { value: "adult", label: "Adult" },
          ]}
        />
        <ChipGroup
          legend="Reaction"
          mode="single"
          value={companionReaction}
          onChange={(value) => setCompanionReaction(value as CompanionReaction)}
          options={[
            { value: "idle", label: "Idle" },
            { value: "hello", label: "Hello" },
            { value: "taskDone", label: "Task done" },
            { value: "milestone", label: "Milestone" },
            { value: "focus", label: "Focus" },
          ]}
        />
        <div className="flex items-end gap-6 rounded-card bg-cream p-6">
          <Companion
            stage={companionStage}
            reaction={companionReaction}
            look={{ room: "lavender", outfit: "original" }}
            size="hero"
            onTap={() => setCompanionReaction("hello")}
            onReactionEnd={() => setCompanionReaction("idle")}
          />
          <Companion
            stage={companionStage}
            reaction="idle"
            look={{ room: "lavender", outfit: "original" }}
            size="card"
          />
          <Companion
            stage={companionStage}
            reaction="idle"
            look={{ room: "lavender", outfit: "original" }}
            size="face"
          />
        </div>
      </Section>

      <Section title="FaceAvatar">
        <div className="flex gap-3">
          <FaceAvatar name="Zara" />
          <FaceAvatar name="Malik" />
          <FaceAvatar name="Kemi" />
          <FaceAvatar name="Dayo" />
        </div>
      </Section>

      <Section title="AriBubble">
        <AriBubble
          name="Ari"
          avatar={<Companion stage={companionStage} reaction="idle" look={{ room: "lavender", outfit: "original" }} size="face" />}
        >
          What should I call you?
        </AriBubble>
      </Section>

      <Section title="HeroPortal">
        <HeroPortal
          kicker="Teen stage"
          title="420 / 600 XP"
          tags={<><Tag tone="white">Solo</Tag><Tag tone="cream">5 day streak-free</Tag></>}
          companionSlot={
            <Companion stage={companionStage} reaction="idle" look={{ room: "lavender", outfit: "original" }} size="card" />
          }
        >
          Ari is growing steadily.
        </HeroPortal>
      </Section>

      <Section title="WeekStrip">
        <WeekStrip
          selected={selectedDay}
          onSelect={setSelectedDay}
          days={[
            { date: "2026-11-15", dayLabel: "Sun", dateLabel: "15", isPast: true },
            { date: "2026-11-16", dayLabel: "Mon", dateLabel: "16", isPast: true, hasActivity: true },
            { date: "2026-11-17", dayLabel: "Tue", dateLabel: "17", isToday: true, hasActivity: true },
            { date: "2026-11-18", dayLabel: "Wed", dateLabel: "18" },
            { date: "2026-11-19", dayLabel: "Thu", dateLabel: "19" },
          ]}
        />
      </Section>

      <Section title="MonthCalendar">
        <MonthCalendar
          weekdayLabels={["S", "M", "T", "W", "T", "F", "S"]}
          selected={selectedDay}
          onSelect={setSelectedDay}
          days={Array.from({ length: 30 }, (_, index) => {
            const dayNumber = index + 1;
            return {
              date: `2026-11-${String(dayNumber).padStart(2, "0")}`,
              dateLabel: String(dayNumber),
              isToday: dayNumber === 17,
              isPast: dayNumber < 17,
              hasActivity: dayNumber % 4 === 0,
            };
          })}
        />
      </Section>

      <Section title="DayAgenda">
        <DayAgenda
          items={[
            { id: "1", time: "9:00 AM", title: "Focus: deep work" },
            { id: "2", time: "1:00 PM", title: "Walk" },
          ]}
        />
      </Section>

      <Section title="RatingOrbs">
        <RatingOrbs legend="How does Rest feel?" value={rating} onChange={setRating} />
      </Section>

      <Section title="HaradaGrid">
        <HaradaGrid
          goalLabel="Run a 10k"
          selectedAreaId={selectedArea}
          onSelectArea={setSelectedArea}
          areas={[
            { id: "rest", name: "Rest", actionCount: 2 },
            { id: "health", name: "Health", actionCount: 3 },
            { id: "work", name: "Work", actionCount: 1 },
            { id: "family", name: "Family", actionCount: 0 },
            { id: "learning", name: "Learning", actionCount: 2 },
            { id: "finances", name: "Finances", actionCount: 1 },
            { id: "fun", name: "Fun", actionCount: 0 },
            { id: "community", name: "Community", actionCount: 1 },
          ]}
        />
      </Section>

      <Section title="QuadrantBoard">
        <QuadrantBoard
          items={{
            doNext: [<Card key="1">Draft the audit summary</Card>],
            planATime: [],
            reconsider: [<Card key="2">Redesign the logo</Card>],
            leaveRoom: [],
          }}
        />
      </Section>

      <Section title="Skeleton">
        <Skeleton className="h-16 w-full" aria-label="Loading content" />
      </Section>

      <Section title="Sheet & Toast">
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth={false} onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
          <Button variant="secondary" fullWidth={false} onClick={() => setToastVisible(true)}>
            Show toast
          </Button>
        </div>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Quick create">
          <p className="font-heading text-body text-text-muted">Sheet content goes here.</p>
        </Sheet>
        {toastVisible ? <Toast message="Task added to today" onDismiss={() => setToastVisible(false)} /> : null}
      </Section>

      <Section title="Sidebar (desktop)">
        <div className="h-72 overflow-hidden rounded-card border border-outline">
          <Sidebar
            activeKey="home"
            hrefs={{ home: "#", plan: "#", create: "#", progress: "#", me: "#" }}
          />
        </div>
      </Section>

      <BottomNav
        activeKey="home"
        hrefs={{ home: "#", plan: "#", progress: "#", me: "#" }}
        onCreate={() => setSheetOpen(true)}
      />
    </main>
  );
}
