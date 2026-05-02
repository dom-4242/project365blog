-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "breakfast" TEXT,
    "snackMorning" TEXT,
    "lunch" TEXT,
    "snackAfternoon" TEXT,
    "dinner" TEXT,
    "snack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_date_key" ON "MealPlan"("date");

-- CreateIndex
CREATE INDEX "MealPlan_date_idx" ON "MealPlan"("date");
