-- Focus rounds with a server-stamped start. Additive only.
CREATE TYPE "FocusMode" AS ENUM ('SOLO', 'SQUAD');

CREATE TABLE "focus_session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clientKey" TEXT NOT NULL,
  "taskId" TEXT,
  "mode" "FocusMode" NOT NULL DEFAULT 'SOLO',
  "plannedMinutes" INTEGER NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "focusedSeconds" INTEGER NOT NULL DEFAULT 0,
  "verified" BOOLEAN NOT NULL DEFAULT true,
  "xpAwarded" INTEGER NOT NULL DEFAULT 0,
  "stopReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "focus_session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "focus_session_userId_clientKey_key" ON "focus_session"("userId", "clientKey");
CREATE INDEX "focus_session_userId_endedAt_idx" ON "focus_session"("userId", "endedAt");

ALTER TABLE "focus_session" ADD CONSTRAINT "focus_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
