/*
  Warnings:

  - You are about to drop the column `defaultShiftId` on the `Employee` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_defaultShiftId_fkey";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "defaultShiftId";
