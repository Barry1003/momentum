-- Append-only per-user XP accounting and privately acknowledged growth celebrations.
-- No existing migration is modified.
CREATE TYPE "XpSource" AS ENUM ('TASK', 'HABIT', 'HABIT_MOMENT', 'FOCUS', 'CHECK_IN', 'MILESTONE', 'GOAL', 'ACHIEVEMENT', 'OPENING_BALANCE');
CREATE TYPE "GrowthEventKind" AS ENUM ('STAGE_UP', 'ACHIEVEMENT');

ALTER TABLE "habit_log" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "xp_event" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "source" "XpSource" NOT NULL,
  "sourceId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "xp_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_event" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "GrowthEventKind" NOT NULL,
  "stage" "AvatarGrowthStage",
  "achievementId" TEXT,
  "atXp" INTEGER NOT NULL,
  "acknowledgedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "growth_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "xp_event_userId_idempotencyKey_key" ON "xp_event"("userId", "idempotencyKey");
CREATE INDEX "xp_event_userId_createdAt_idx" ON "xp_event"("userId", "createdAt");
CREATE INDEX "xp_event_userId_source_sourceId_idx" ON "xp_event"("userId", "source", "sourceId");
CREATE INDEX "growth_event_userId_kind_acknowledgedAt_createdAt_idx" ON "growth_event"("userId", "kind", "acknowledgedAt", "createdAt");

ALTER TABLE "xp_event" ADD CONSTRAINT "xp_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "growth_event" ADD CONSTRAINT "growth_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry any XP an avatar already holds into the ledger, so the first new award doesn't reset it.
INSERT INTO "xp_event" ("id", "userId", "source", "sourceId", "idempotencyKey", "amount")
SELECT 'opening_' || "userId", "userId", 'OPENING_BALANCE', "userId", 'opening-balance', "totalXp"
FROM "avatar" WHERE "totalXp" > 0;
