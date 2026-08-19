-- Merge Employee into User (single table)
-- 1) Add employee attributes to User
ALTER TABLE "User"
  ADD COLUMN "employeeCode" TEXT,
  ADD COLUMN "departmentId" TEXT,
  ADD COLUMN "position" TEXT,
  ADD COLUMN "joinedAt" TIMESTAMP(3);

-- 2) Backfill User from the existing Employee rows
UPDATE "User" u
SET "employeeCode" = e."employeeCode",
    "departmentId" = e."departmentId",
    "position" = e."position",
    "joinedAt" = e."joinedAt"
FROM "Employee" e
WHERE e."userId" = u."id";

-- 3) Repoint WorkSchedule to User
ALTER TABLE "WorkSchedule" ADD COLUMN "userId" TEXT;

UPDATE "WorkSchedule" ws
SET "userId" = e."userId"
FROM "Employee" e
WHERE e."id" = ws."employeeId";

ALTER TABLE "WorkSchedule" ALTER COLUMN "userId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "WorkSchedule" DROP CONSTRAINT "WorkSchedule_employeeId_fkey";

-- AlterTable (drops the employeeId_dayOfWeek unique index together with the column)
ALTER TABLE "WorkSchedule" DROP COLUMN "employeeId";

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_userId_dayOfWeek_key" ON "WorkSchedule"("userId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4) Drop the redundant CheckIn.employeeId link
-- DropForeignKey
ALTER TABLE "CheckIn" DROP CONSTRAINT "CheckIn_employeeId_fkey";

-- AlterTable
ALTER TABLE "CheckIn" DROP COLUMN "employeeId";

-- 5) Indexes on the merged User columns
-- CreateIndex
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- 6) Drop the Employee table
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_userId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_departmentId_fkey";

-- DropTable
DROP TABLE "Employee";

-- 7) Department relation now lives on User
-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
