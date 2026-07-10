-- Score-System Rückbau (Nutrition-Umbau, N-09 · Big-Bang Cut-over)
--
-- WICHTIG: Vor dem Deploy dieser Migration auf der Produktion MUSS ein
-- Voll-Backup der DB sowie ein Export von MealLog/MealPlan (JSON/CSV) erfolgen
-- (siehe scripts/export-score-data.ts). Danach ist der Rückbau irreversibel.
--
-- 1) JournalEntry.nutrition: NutritionLevel -> FulfillmentStatus, mit Legacy-Mapping
--    THREE_MEALS/TWO_MEALS -> FULFILLED, ONE_MEAL/NONE -> NOT_FULFILLED.
ALTER TABLE "JournalEntry"
  ALTER COLUMN "nutrition" TYPE "FulfillmentStatus"
  USING (
    CASE
      WHEN "nutrition"::text IN ('THREE_MEALS', 'TWO_MEALS') THEN 'FULFILLED'::"FulfillmentStatus"
      ELSE 'NOT_FULFILLED'::"FulfillmentStatus"
    END
  );

ALTER TABLE "JournalEntry" ALTER COLUMN "nutrition" SET DEFAULT 'OPEN';

-- 2) Score-/Planungs-Tabellen entfernen (Export vorher!)
DROP TABLE "MealLog";
DROP TABLE "MealPlan";

-- 3) Altes Enum entfernen (nach dem Spalten-Umbau nicht mehr referenziert)
DROP TYPE "NutritionLevel";
