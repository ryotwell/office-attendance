/*
  Warnings:

  - Added the required column `effectiveShift` to the `CheckIn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Shift" ADD VALUE 'PAGIATAUSIANG';

-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "effectiveShift" "Shift" NOT NULL;
