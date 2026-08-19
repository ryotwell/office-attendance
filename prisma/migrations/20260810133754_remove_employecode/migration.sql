/*
  Warnings:

  - You are about to drop the column `employeeCode` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_employeeCode_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "employeeCode";
