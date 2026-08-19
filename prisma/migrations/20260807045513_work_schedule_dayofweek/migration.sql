/*
  Warnings:

  - You are about to drop the `ScheduleAssignment` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- DropForeignKey
ALTER TABLE "ScheduleAssignment" DROP CONSTRAINT "ScheduleAssignment_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleAssignment" DROP CONSTRAINT "ScheduleAssignment_shiftId_fkey";

-- DropTable
DROP TABLE "ScheduleAssignment";

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSchedule_dayOfWeek_idx" ON "WorkSchedule"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_employeeId_dayOfWeek_key" ON "WorkSchedule"("employeeId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
