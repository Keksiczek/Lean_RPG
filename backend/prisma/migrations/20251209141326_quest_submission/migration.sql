/*
  Warnings:

  - Added the required column `content` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questId` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quest" ADD COLUMN "briefText" TEXT;
ALTER TABLE "Quest" ADD COLUMN "leanConcept" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Submission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "questId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "userQuestId" INTEGER,
    "workstationId" INTEGER,
    "textInput" TEXT,
    "imageUrl" TEXT,
    "aiFeedback" TEXT,
    "aiScore5s" TEXT,
    "aiRiskLevel" TEXT,
    "xpGain" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending_analysis',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Submission_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Submission_userQuestId_fkey" FOREIGN KEY ("userQuestId") REFERENCES "UserQuest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Submission_workstationId_fkey" FOREIGN KEY ("workstationId") REFERENCES "Workstation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("aiFeedback", "aiRiskLevel", "aiScore5s", "createdAt", "id", "imageUrl", "status", "textInput", "userQuestId", "workstationId", "xpGain") SELECT "aiFeedback", "aiRiskLevel", "aiScore5s", "createdAt", "id", "imageUrl", "status", "textInput", "userQuestId", "workstationId", "xpGain" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
