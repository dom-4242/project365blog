-- CreateTable
CREATE TABLE "HealthMetricInventory" (
    "metricName" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "lastValue" DOUBLE PRECISION,
    "lastValueDate" TEXT,
    "lastReceivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthMetricInventory_pkey" PRIMARY KEY ("metricName")
);
