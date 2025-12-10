-- Adjust Achievement badge relation to allow null on delete and ensure constraint exists
ALTER TABLE "Achievement" DROP CONSTRAINT IF EXISTS "Achievement_badgeId_fkey";
ALTER TABLE "Achievement"
ADD CONSTRAINT "Achievement_badgeId_fkey"
FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
