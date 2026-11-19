-- One-time codes for email change and account deletion, and scheduled deletions. Additive only.
CREATE TYPE "AccountRequestKind" AS ENUM ('EMAIL_CHANGE', 'DELETE_ACCOUNT');

CREATE TABLE "account_request" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "AccountRequestKind" NOT NULL,
  "codeHash" TEXT NOT NULL,
  "newEmail" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_request_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "account_request_userId_kind_createdAt_idx" ON "account_request"("userId", "kind", "createdAt");
ALTER TABLE "account_request" ADD CONSTRAINT "account_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "account_deletion" (
  "userId" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "account_deletion_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "account_deletion" ADD CONSTRAINT "account_deletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
