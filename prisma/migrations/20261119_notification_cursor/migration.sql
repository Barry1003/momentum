-- Read marker for the notification list. Additive only.
CREATE TABLE "notification_cursor" (
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_cursor_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "notification_cursor" ADD CONSTRAINT "notification_cursor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
