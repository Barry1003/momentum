-- Cheers, mutes, reports and shared-goal preferences. Additive only.
CREATE TABLE "cheer" (
  "id" TEXT NOT NULL,
  "fromUserId" TEXT NOT NULL,
  "toUserId" TEXT NOT NULL,
  "squadId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "momentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cheer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cheer_fromUserId_toUserId_createdAt_idx" ON "cheer"("fromUserId", "toUserId", "createdAt");
CREATE INDEX "cheer_toUserId_createdAt_idx" ON "cheer"("toUserId", "createdAt");
ALTER TABLE "cheer" ADD CONSTRAINT "cheer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cheer" ADD CONSTRAINT "cheer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "squad_mute" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "mutedUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "squad_mute_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "squad_mute_userId_mutedUserId_key" ON "squad_mute"("userId", "mutedUserId");
ALTER TABLE "squad_mute" ADD CONSTRAINT "squad_mute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "squad_mute" ADD CONSTRAINT "squad_mute_mutedUserId_fkey" FOREIGN KEY ("mutedUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "squad_report" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "squadId" TEXT NOT NULL,
  "reportedUserId" TEXT,
  "reason" TEXT NOT NULL,
  "details" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "squad_report_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "squad_report_reporterId_createdAt_idx" ON "squad_report"("reporterId", "createdAt");
CREATE INDEX "squad_report_status_createdAt_idx" ON "squad_report"("status", "createdAt");
ALTER TABLE "squad_report" ADD CONSTRAINT "squad_report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "goal_share_pref" (
  "goalId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "showCount" BOOLEAN NOT NULL DEFAULT true,
  "showNames" BOOLEAN NOT NULL DEFAULT false,
  "linkTask" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "goal_share_pref_pkey" PRIMARY KEY ("goalId", "userId")
);
ALTER TABLE "goal_share_pref" ADD CONSTRAINT "goal_share_pref_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
