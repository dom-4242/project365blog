-- Punkt 4: FoodItem Daten-Qualität — geprüft/angereichert via Nährwerttabellen-Foto (AI)
ALTER TABLE "FoodItem" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FoodItem" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "FoodItem" ADD COLUMN "labelImagePath" TEXT;

CREATE INDEX "FoodItem_verified_idx" ON "FoodItem"("verified");
