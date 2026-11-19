-- XP for finishing a 15-day review.
ALTER TYPE "XpSource" ADD VALUE 'REVIEW';

-- Growth Studio state and 15-day reviews. Additive only.
CREATE TABLE "growth_studio" (
  "userId" TEXT NOT NULL,
  "areas" JSONB NOT NULL,
  "answers" JSONB NOT NULL,
  "lastPausedAreaId" TEXT,
  "grid" JSONB,
  "cycleStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "growth_studio_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "growth_studio" ADD CONSTRAINT "growth_studio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "growth_review" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "cycle" INTEGER NOT NULL,
  "obstacles" TEXT[],
  "context" TEXT NOT NULL DEFAULT '',
  "changes" JSONB NOT NULL,
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "growth_review_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "growth_review_userId_cycle_key" ON "growth_review"("userId", "cycle");
ALTER TABLE "growth_review" ADD CONSTRAINT "growth_review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
