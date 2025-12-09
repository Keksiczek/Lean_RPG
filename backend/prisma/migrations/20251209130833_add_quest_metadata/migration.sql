-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "baseXp" INTEGER NOT NULL DEFAULT 10,
    "briefText" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'easy',
    "leanConcept" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "areaId" INTEGER,
    CONSTRAINT "Quest_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quest" ("areaId", "baseXp", "description", "id", "isActive", "title", "type") SELECT "areaId", "baseXp", "description", "id", "isActive", "title", "type" FROM "Quest";
DROP TABLE "Quest";
ALTER TABLE "new_Quest" RENAME TO "Quest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
