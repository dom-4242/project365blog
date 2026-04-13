CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "chest" DOUBLE PRECISION,
    "waist" DOUBLE PRECISION,
    "hip" DOUBLE PRECISION,
    "upperArmLeft" DOUBLE PRECISION,
    "upperArmRight" DOUBLE PRECISION,
    "thighLeft" DOUBLE PRECISION,
    "thighRight" DOUBLE PRECISION,
    "calfLeft" DOUBLE PRECISION,
    "calfRight" DOUBLE PRECISION,
    "neck" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BodyMeasurement_date_key" ON "BodyMeasurement"("date");
CREATE INDEX "BodyMeasurement_date_idx" ON "BodyMeasurement"("date");
