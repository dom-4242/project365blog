-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "breakfast" INTEGER,
    "snackMorning" INTEGER,
    "lunch" INTEGER,
    "snackAfternoon" INTEGER,
    "dinner" INTEGER,
    "snack" INTEGER,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MealLog_date_key" ON "MealLog"("date");

-- CreateIndex
CREATE INDEX "MealLog_date_idx" ON "MealLog"("date");
