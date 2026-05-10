-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('FULL', 'FILLER');

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN "entryType" "EntryType" NOT NULL DEFAULT 'FULL';
