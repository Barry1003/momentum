-- Per-person preferences. Additive only; a missing row means "defaults".
CREATE TABLE "user_settings" (
  "userId" TEXT NOT NULL,
  "handle" TEXT,
  "intention" TEXT NOT NULL DEFAULT '',
  "shareCheckedIn" BOOLEAN NOT NULL DEFAULT true,
  "shareFocusStatus" BOOLEAN NOT NULL DEFAULT true,
  "shareFinishedSharedTasks" BOOLEAN NOT NULL DEFAULT true,
  "shareGrowthStage" BOOLEAN NOT NULL DEFAULT true,
  "shareStreaksAndXp" BOOLEAN NOT NULL DEFAULT false,
  "morningPlan" BOOLEAN NOT NULL DEFAULT true,
  "morningPlanTime" TEXT NOT NULL DEFAULT '08:30',
  "eveningCheckIn" BOOLEAN NOT NULL DEFAULT true,
  "eveningCheckInTime" TEXT NOT NULL DEFAULT '21:00',
  "habitReminders" BOOLEAN NOT NULL DEFAULT true,
  "squadCheers" BOOLEAN NOT NULL DEFAULT false,
  "reviewDay" BOOLEAN NOT NULL DEFAULT true,
  "quietEnabled" BOOLEAN NOT NULL DEFAULT true,
  "quietFrom" TEXT NOT NULL DEFAULT '22:00',
  "quietTo" TEXT NOT NULL DEFAULT '08:00',
  "quietDays" TEXT NOT NULL DEFAULT 'everyDay',
  "quietCustomDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_settings_pkey" PRIMARY KEY ("userId")
);
CREATE UNIQUE INDEX "user_settings_handle_key" ON "user_settings"("handle");
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
