-- Create Achievement table
CREATE TABLE "Achievement" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Achievement_userId_name_key" UNIQUE ("userId", "name")
);

-- Create LeaderboardHistory table
CREATE TABLE "LeaderboardHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "totalXp" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaderboardHistory_pkey" PRIMARY KEY ("id")
);

-- Align xpGain defaults for existing submissions
ALTER TABLE "Submission" ALTER COLUMN "xpGain" SET DEFAULT 0;
UPDATE "Submission" SET "xpGain" = 0 WHERE "xpGain" IS NULL;

-- Indexes for performance
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");
CREATE INDEX "LeaderboardHistory_userId_timestamp_idx" ON "LeaderboardHistory"("userId", "timestamp");

-- Foreign keys
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeaderboardHistory" ADD CONSTRAINT "LeaderboardHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
