-- Baseline migration: initial schema (JournalEntry, DailyMetrics, Reaction)

-- Enums

CREATE TYPE "MovementLevel" AS ENUM ('MINIMAL', 'STEPS_ONLY', 'STEPS_TRAINED');
CREATE TYPE "NutritionLevel" AS ENUM ('NONE', 'ONE', 'TWO', 'THREE');
CREATE TYPE "SmokingStatus" AS ENUM ('SMOKED', 'REPLACEMENT', 'NONE');
CREATE TYPE "MetricSource" AS ENUM ('MANUAL', 'FITBIT', 'APPLE_HEALTH', 'MERGED');
CREATE TYPE "ReactionType" AS ENUM ('HEART', 'CLAP', 'FIRE', 'MUSCLE', 'STAR');

-- JournalEntry

CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "bannerUrl" TEXT,
    "tags" TEXT[],
    "date" DATE NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "movement" "MovementLevel" NOT NULL,
    "nutrition" "NutritionLevel" NOT NULL,
    "smoking" "SmokingStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JournalEntry_slug_key" ON "JournalEntry"("slug");
CREATE INDEX "JournalEntry_date_idx" ON "JournalEntry"("date");
CREATE INDEX "JournalEntry_published_idx" ON "JournalEntry"("published");

-- DailyMetrics

CREATE TABLE "DailyMetrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weight" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "steps" INTEGER,
    "activeMinutes" INTEGER,
    "caloriesBurned" INTEGER,
    "distance" DOUBLE PRECISION,
    "restingHR" INTEGER,
    "sleepDuration" INTEGER,
    "source" "MetricSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMetrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyMetrics_date_key" ON "DailyMetrics"("date");
CREATE INDEX "DailyMetrics_date_idx" ON "DailyMetrics"("date");

-- Reaction

CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "emoji" "ReactionType" NOT NULL,
    "ipHash" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Reaction_entryId_emoji_ipHash_key" ON "Reaction"("entryId", "emoji", "ipHash");
CREATE INDEX "Reaction_entryId_idx" ON "Reaction"("entryId");

ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_entryId_fkey"
    FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
