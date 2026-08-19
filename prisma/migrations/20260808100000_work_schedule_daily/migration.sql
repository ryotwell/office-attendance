-- WorkSchedule: one shift per user, applies to every working day except Sunday.
-- 1) Collapse existing per-day rows to a single row per user (keep the earliest).
DELETE FROM "WorkSchedule" ws
USING (
  SELECT "id",
         row_number() OVER (PARTITION BY "userId" ORDER BY "createdAt", "id") AS rn
  FROM "WorkSchedule"
) keep
WHERE ws."id" = keep."id" AND keep.rn > 1;

-- DropIndex
DROP INDEX "WorkSchedule_dayOfWeek_idx";

-- Drop the per-day unique index
DROP INDEX "WorkSchedule_userId_dayOfWeek_key";

-- AlterTable
ALTER TABLE "WorkSchedule" DROP COLUMN "dayOfWeek";

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_userId_key" ON "WorkSchedule"("userId");

-- DropType
DROP TYPE "DayOfWeek";
