-- AlterTable: meal rating columns Int → Float for continuous 1-10 scale
ALTER TABLE "MealLog"
  ALTER COLUMN "breakfast"      TYPE DOUBLE PRECISION,
  ALTER COLUMN "snackMorning"   TYPE DOUBLE PRECISION,
  ALTER COLUMN "lunch"          TYPE DOUBLE PRECISION,
  ALTER COLUMN "snackAfternoon" TYPE DOUBLE PRECISION,
  ALTER COLUMN "dinner"         TYPE DOUBLE PRECISION,
  ALTER COLUMN "snack"          TYPE DOUBLE PRECISION;
