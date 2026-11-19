-- Daily check-ins and earned achievements. Additive only.
CREATE TABLE "check_in" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "mood" TEXT NOT NULL,
  "effort" TEXT NOT NULL,
  "win" TEXT NOT NULL DEFAULT '',
  "obstacle" TEXT NOT NULL DEFAULT '',
  "shareCheckedIn" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "check_in_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "check_in_userId_date_key" ON "check_in"("userId", "date");
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_achievement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "achievementId" TEXT NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isShared" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "user_achievement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_achievement_userId_achievementId_key" ON "user_achievement"("userId", "achievementId");
ALTER TABLE "user_achievement" ADD CONSTRAINT "user_achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
