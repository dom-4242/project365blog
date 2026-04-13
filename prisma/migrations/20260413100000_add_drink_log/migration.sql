CREATE TYPE "DrinkType" AS ENUM ('WATER', 'COLA_ZERO');

CREATE TABLE "DrinkLog" (
    "id" TEXT NOT NULL,
    "type" "DrinkType" NOT NULL,
    "volume" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrinkLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DrinkLog_timestamp_idx" ON "DrinkLog"("timestamp");
