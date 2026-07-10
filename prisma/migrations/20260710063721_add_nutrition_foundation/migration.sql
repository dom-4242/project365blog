-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('FULFILLED', 'NOT_FULFILLED', 'OPEN');

-- CreateEnum
CREATE TYPE "DayType" AS ENUM ('NORMAL', 'REFEED');

-- CreateEnum
CREATE TYPE "PhaseMode" AS ENUM ('DEFICIT', 'MAINTENANCE', 'SURPLUS');

-- CreateEnum
CREATE TYPE "FoodSource" AS ENUM ('EXTERNAL_DB', 'MANUAL', 'AI');

-- CreateEnum
CREATE TYPE "MealSource" AS ENUM ('BARCODE', 'PHOTO_AI', 'MANUAL', 'FAVORITE', 'DISH');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('PLATE', 'MENU');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "DeficitMethod" AS ENUM ('MODERATE', 'AGGRESSIVE', 'SIMPLE');

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "barcode" TEXT,
    "source" "FoodSource" NOT NULL DEFAULT 'MANUAL',
    "baseUnit" TEXT NOT NULL DEFAULT 'g',
    "kcal" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "fiberG" DOUBLE PRECISION,
    "sugarG" DOUBLE PRECISION,
    "saturatedFatG" DOUBLE PRECISION,
    "sodiumMg" DOUBLE PRECISION,
    "potassiumMg" DOUBLE PRECISION,
    "ironMg" DOUBLE PRECISION,
    "magnesiumMg" DOUBLE PRECISION,
    "calciumMg" DOUBLE PRECISION,
    "zincMg" DOUBLE PRECISION,
    "vitaminDUg" DOUBLE PRECISION,
    "vitaminB12Ug" DOUBLE PRECISION,
    "vitaminCMg" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "externalDbId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dish" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DishItem" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "foodItemId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "DishItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "foodItemId" TEXT,
    "dishId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealEntry" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealSlot" TEXT,
    "sourceType" "MealSource" NOT NULL,
    "foodItemId" TEXT,
    "dishId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "kcal" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "fiberG" DOUBLE PRECISION,
    "sugarG" DOUBLE PRECISION,
    "saturatedFatG" DOUBLE PRECISION,
    "sodiumMg" DOUBLE PRECISION,
    "potassiumMg" DOUBLE PRECISION,
    "ironMg" DOUBLE PRECISION,
    "magnesiumMg" DOUBLE PRECISION,
    "calciumMg" DOUBLE PRECISION,
    "zincMg" DOUBLE PRECISION,
    "vitaminDUg" DOUBLE PRECISION,
    "vitaminB12Ug" DOUBLE PRECISION,
    "vitaminCMg" DOUBLE PRECISION,
    "externalName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPhoto" (
    "id" TEXT NOT NULL,
    "mealEntryId" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "photoType" "PhotoType" NOT NULL,
    "aiAnalysis" JSONB,
    "aiConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Day" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "dayType" "DayType" NOT NULL DEFAULT 'NORMAL',
    "phaseId" TEXT,
    "targetKcal" DOUBLE PRECISION,
    "targetProteinG" DOUBLE PRECISION,
    "targetFatG" DOUBLE PRECISION,
    "targetCarbsG" DOUBLE PRECISION,
    "actualKcal" DOUBLE PRECISION,
    "actualProteinG" DOUBLE PRECISION,
    "actualFatG" DOUBLE PRECISION,
    "actualCarbsG" DOUBLE PRECISION,
    "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'OPEN',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "mode" "PhaseMode" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "targetsId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionTargets" (
    "id" TEXT NOT NULL,
    "validFrom" DATE NOT NULL,
    "baseWeightKg" DOUBLE PRECISION NOT NULL,
    "sex" "Sex" NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "age" INTEGER NOT NULL,
    "bodyFatPct" DOUBLE PRECISION,
    "activityFactor" DOUBLE PRECISION NOT NULL,
    "deficitMode" "DeficitMethod" NOT NULL,
    "targetKcal" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "mealsPerDay" INTEGER NOT NULL,
    "calcNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionTargets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefeedRule" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "recurringWeekdays" INTEGER[],
    "refeedKcal" DOUBLE PRECISION NOT NULL,
    "refeedProteinG" DOUBLE PRECISION NOT NULL,
    "refeedFatG" DOUBLE PRECISION NOT NULL,
    "refeedCarbsG" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefeedRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodItem_barcode_key" ON "FoodItem"("barcode");

-- CreateIndex
CREATE INDEX "FoodItem_barcode_idx" ON "FoodItem"("barcode");

-- CreateIndex
CREATE INDEX "FoodItem_isActive_idx" ON "FoodItem"("isActive");

-- CreateIndex
CREATE INDEX "Dish_isActive_idx" ON "Dish"("isActive");

-- CreateIndex
CREATE INDEX "DishItem_dishId_idx" ON "DishItem"("dishId");

-- CreateIndex
CREATE INDEX "DishItem_foodItemId_idx" ON "DishItem"("foodItemId");

-- CreateIndex
CREATE INDEX "Favorite_foodItemId_idx" ON "Favorite"("foodItemId");

-- CreateIndex
CREATE INDEX "Favorite_dishId_idx" ON "Favorite"("dishId");

-- CreateIndex
CREATE INDEX "Favorite_sortOrder_idx" ON "Favorite"("sortOrder");

-- CreateIndex
CREATE INDEX "MealEntry_dayId_idx" ON "MealEntry"("dayId");

-- CreateIndex
CREATE INDEX "MealEntry_foodItemId_idx" ON "MealEntry"("foodItemId");

-- CreateIndex
CREATE INDEX "MealEntry_dishId_idx" ON "MealEntry"("dishId");

-- CreateIndex
CREATE INDEX "MealPhoto_mealEntryId_idx" ON "MealPhoto"("mealEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "Day_date_key" ON "Day"("date");

-- CreateIndex
CREATE INDEX "Day_phaseId_idx" ON "Day"("phaseId");

-- CreateIndex
CREATE INDEX "Day_fulfillmentStatus_idx" ON "Day"("fulfillmentStatus");

-- CreateIndex
CREATE INDEX "Phase_status_idx" ON "Phase"("status");

-- CreateIndex
CREATE INDEX "Phase_startDate_idx" ON "Phase"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionTargets_validFrom_key" ON "NutritionTargets"("validFrom");

-- CreateIndex
CREATE INDEX "NutritionTargets_validFrom_idx" ON "NutritionTargets"("validFrom");

-- CreateIndex
CREATE INDEX "RefeedRule_phaseId_idx" ON "RefeedRule"("phaseId");

-- AddForeignKey
ALTER TABLE "DishItem" ADD CONSTRAINT "DishItem_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DishItem" ADD CONSTRAINT "DishItem_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealEntry" ADD CONSTRAINT "MealEntry_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealEntry" ADD CONSTRAINT "MealEntry_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealEntry" ADD CONSTRAINT "MealEntry_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPhoto" ADD CONSTRAINT "MealPhoto_mealEntryId_fkey" FOREIGN KEY ("mealEntryId") REFERENCES "MealEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_targetsId_fkey" FOREIGN KEY ("targetsId") REFERENCES "NutritionTargets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefeedRule" ADD CONSTRAINT "RefeedRule_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
