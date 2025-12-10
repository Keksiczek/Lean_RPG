-- CreateTable
CREATE TABLE "ProblemSolvingChallenge" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "baseXp" INTEGER NOT NULL,
    "correctRootCauseId" INTEGER NOT NULL,
    "correctCategories" JSONB NOT NULL,
    "possibleCauses" JSONB NOT NULL,
    "correctSolution" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProblemSolvingChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemAnalysis" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "challengeId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "selectedCategories" JSONB,
    "causes" JSONB,
    "rootCauseId" INTEGER,
    "rootCause" TEXT,
    "proposedSolution" TEXT,
    "solutionDetails" TEXT,
    "causeCount" INTEGER,
    "categoryCompleteness" INTEGER,
    "rootCauseCorrect" BOOLEAN DEFAULT false,
    "solutionQuality" TEXT,
    "totalScore" INTEGER,
    "aiFeedback" TEXT,
    "categoryFeedback" JSONB,
    "improvements" TEXT,
    "xpGain" INTEGER NOT NULL DEFAULT 0,
    "pointsGain" INTEGER NOT NULL DEFAULT 0,
    "badgeEarned" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "timeSpent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProblemAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IshikawaHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "analysisId" INTEGER NOT NULL,
    "diagramJson" JSONB NOT NULL,
    "solvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IshikawaHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProblemSolvingChallenge" ADD CONSTRAINT "ProblemSolvingChallenge_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemAnalysis" ADD CONSTRAINT "ProblemAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemAnalysis" ADD CONSTRAINT "ProblemAnalysis_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "ProblemSolvingChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IshikawaHistory" ADD CONSTRAINT "IshikawaHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IshikawaHistory" ADD CONSTRAINT "IshikawaHistory_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ProblemAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
