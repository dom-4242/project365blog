-- CreateTable
CREATE TABLE "FitbitSyncLog" (
    "id" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredBy" TEXT NOT NULL DEFAULT 'CRON',
    "syncDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "activeMinutes" INTEGER,
    "caloriesBurned" INTEGER,
    "distance" DOUBLE PRECISION,
    "restingHR" INTEGER,
    "tokensRefreshed" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,

    CONSTRAINT "FitbitSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FitbitSyncLog_syncedAt_idx" ON "FitbitSyncLog"("syncedAt" DESC);
