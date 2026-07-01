-- Add WITHINGS to MetricSource (FITBIT kept for historical rows)
ALTER TYPE "MetricSource" ADD VALUE 'WITHINGS';

-- CreateTable: generic raw store for every Withings measure
CREATE TABLE "WithingsMeasurement" (
    "id" TEXT NOT NULL,
    "grpid" BIGINT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "date" DATE NOT NULL,
    "type" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WithingsMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WithingsMeasurement_grpid_type_key" ON "WithingsMeasurement"("grpid", "type");

-- CreateIndex
CREATE INDEX "WithingsMeasurement_date_idx" ON "WithingsMeasurement"("date");

-- CreateIndex
CREATE INDEX "WithingsMeasurement_type_idx" ON "WithingsMeasurement"("type");

-- CreateTable: sync run log
CREATE TABLE "WithingsSyncLog" (
    "id" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredBy" TEXT NOT NULL DEFAULT 'CRON',
    "syncDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "measureCount" INTEGER,
    "tokensRefreshed" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,

    CONSTRAINT "WithingsSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WithingsSyncLog_syncedAt_idx" ON "WithingsSyncLog"("syncedAt" DESC);

-- DropTable: Fitbit sync log (integration removed)
DROP TABLE "FitbitSyncLog";
