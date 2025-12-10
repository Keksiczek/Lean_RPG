-- CreateTable
CREATE TABLE "FiveSSetting" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "sortCriteria" JSONB NOT NULL,
    "orderCriteria" JSONB NOT NULL,
    "shineCriteria" JSONB NOT NULL,
    "standardizeCriteria" JSONB NOT NULL,
    "sustainCriteria" JSONB NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "timeLimit" INTEGER NOT NULL,
    "maxProblems" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FiveSSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiveSAudit" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "settingId" INTEGER NOT NULL,
    "areaId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "sortScore" INTEGER,
    "orderScore" INTEGER,
    "shineScore" INTEGER,
    "standardizeScore" INTEGER,
    "sustainScore" INTEGER,
    "totalScore" INTEGER,
    "problemsFound" JSONB,
    "aiFeedback" TEXT,
    "mainIssue" TEXT,
    "xpGain" INTEGER NOT NULL DEFAULT 0,
    "pointsGain" INTEGER NOT NULL DEFAULT 0,
    "badgeEarned" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "timeSpent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FiveSAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiveSProblem" (
    "id" SERIAL NOT NULL,
    "auditId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "screenshot" TEXT,
    "severity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FiveSProblem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FiveSSetting" ADD CONSTRAINT "FiveSSetting_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiveSAudit" ADD CONSTRAINT "FiveSAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiveSAudit" ADD CONSTRAINT "FiveSAudit_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "FiveSSetting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiveSAudit" ADD CONSTRAINT "FiveSAudit_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiveSProblem" ADD CONSTRAINT "FiveSProblem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "FiveSAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
