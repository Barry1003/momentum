-- Goal milestones and their checklist criteria. Additive only.
CREATE TABLE "goal_milestone" (
  "id" TEXT NOT NULL,
  "goalId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "reachedAt" TIMESTAMP(3),
  "reachedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "goal_milestone_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "goal_milestone_goalId_position_idx" ON "goal_milestone"("goalId", "position");
ALTER TABLE "goal_milestone" ADD CONSTRAINT "goal_milestone_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "goal_criterion" (
  "id" TEXT NOT NULL,
  "milestoneId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "position" INTEGER NOT NULL,
  CONSTRAINT "goal_criterion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "goal_criterion_milestoneId_position_idx" ON "goal_criterion"("milestoneId", "position");
ALTER TABLE "goal_criterion" ADD CONSTRAINT "goal_criterion_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "goal_milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
