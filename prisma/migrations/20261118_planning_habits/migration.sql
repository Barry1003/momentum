-- Additive migration: preserves onboarding, squad, auth and avatar data.
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE','COMPLETED','ARCHIVED');
CREATE TYPE "GoalSource" AS ENUM ('MANUAL','GROWTH_STUDIO');
CREATE TYPE "GoalMemberRole" AS ENUM ('EDITOR','VIEWER');
CREATE TYPE "TaskVisibility" AS ENUM ('PRIVATE','SQUAD');
CREATE TYPE "TaskPriority" AS ENUM ('NONE','LOW','MEDIUM','HIGH');
CREATE TYPE "TaskQuadrant" AS ENUM ('DO','PLAN','RECONSIDER','LEAVE');
CREATE TYPE "HabitTargetType" AS ENUM ('CHECK','COUNT','DURATION');
CREATE TYPE "HabitStatus" AS ENUM ('ACTIVE','PAUSED','ARCHIVED');

CREATE TABLE "goal" (
 "id" TEXT PRIMARY KEY, "ownerId" TEXT NOT NULL, "squadId" TEXT, "title" TEXT NOT NULL,
 "why" TEXT, "area" TEXT, "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
 "targetDate" DATE, "completedAt" TIMESTAMP(3), "source" "GoalSource" NOT NULL DEFAULT 'MANUAL',
 "archivedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "goal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "goal_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "squad"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "goal_ownerId_status_idx" ON "goal"("ownerId","status");
CREATE INDEX "goal_squadId_status_idx" ON "goal"("squadId","status");

CREATE TABLE "goal_member" (
 "id" TEXT PRIMARY KEY, "goalId" TEXT NOT NULL, "userId" TEXT NOT NULL,
 "role" "GoalMemberRole" NOT NULL DEFAULT 'VIEWER',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "goal_member_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goal"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "goal_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "goal_member_goalId_userId_key" ON "goal_member"("goalId","userId");
CREATE INDEX "goal_member_userId_idx" ON "goal_member"("userId");

CREATE TABLE "task" (
 "id" TEXT PRIMARY KEY, "ownerId" TEXT NOT NULL, "assigneeId" TEXT, "goalId" TEXT, "squadId" TEXT,
 "title" TEXT NOT NULL, "notes" TEXT, "dueDate" DATE, "dueTime" TEXT, "durationMin" INTEGER,
 "priority" "TaskPriority" NOT NULL DEFAULT 'NONE',
 "visibility" "TaskVisibility" NOT NULL DEFAULT 'PRIVATE', "quadrant" "TaskQuadrant",
 "archivedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 CONSTRAINT "task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goal"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 CONSTRAINT "task_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "squad"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "task_ownerId_dueDate_idx" ON "task"("ownerId","dueDate");
CREATE INDEX "task_squadId_dueDate_idx" ON "task"("squadId","dueDate");
CREATE INDEX "task_goalId_idx" ON "task"("goalId");

CREATE TABLE "task_completion" (
 "id" TEXT PRIMARY KEY, "taskId" TEXT NOT NULL, "userId" TEXT NOT NULL,
 "occurrenceDate" DATE NOT NULL, "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "task_completion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "task_completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "task_completion_taskId_occurrenceDate_key" ON "task_completion"("taskId","occurrenceDate");
CREATE INDEX "task_completion_userId_occurrenceDate_idx" ON "task_completion"("userId","occurrenceDate");

CREATE TABLE "habit" (
 "id" TEXT PRIMARY KEY, "ownerId" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
 "category" TEXT, "icon" TEXT, "targetType" "HabitTargetType" NOT NULL DEFAULT 'CHECK',
 "targetValue" INTEGER NOT NULL DEFAULT 1, "unit" TEXT, "reminderTime" TEXT,
 "scheduleDays" INTEGER[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6]::INTEGER[],
 "startsOn" DATE, "pausedUntil" DATE,
 "goalId" TEXT, "sharedWithSquadId" TEXT, "status" "HabitStatus" NOT NULL DEFAULT 'ACTIVE',
 "pausedAt" TIMESTAMP(3), "archivedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "habit_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "habit_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goal"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 CONSTRAINT "habit_sharedWithSquadId_fkey" FOREIGN KEY ("sharedWithSquadId") REFERENCES "squad"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "habit_ownerId_status_idx" ON "habit"("ownerId","status");
CREATE INDEX "habit_sharedWithSquadId_idx" ON "habit"("sharedWithSquadId");

CREATE TABLE "habit_log" (
 "id" TEXT PRIMARY KEY, "habitId" TEXT NOT NULL, "userId" TEXT NOT NULL,
 "date" DATE NOT NULL, "value" INTEGER NOT NULL, "completed" BOOLEAN NOT NULL,
 "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "habit_log_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habit"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "habit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "habit_log_habitId_date_key" ON "habit_log"("habitId","date");
CREATE INDEX "habit_log_userId_date_idx" ON "habit_log"("userId","date");
