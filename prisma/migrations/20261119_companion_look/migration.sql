-- Cosmetic companion choices. Additive only; stage stays on "avatar".
CREATE TABLE "companion_look" (
  "userId" TEXT NOT NULL,
  "room" TEXT NOT NULL DEFAULT 'lavender',
  "plinth" TEXT NOT NULL DEFAULT 'cream',
  "outfit" TEXT NOT NULL DEFAULT 'original',
  "accents" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "companion_look_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "companion_look" ADD CONSTRAINT "companion_look_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
