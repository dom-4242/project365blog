-- Add `position` to distinguish segmental measures (fat/muscle per body zone)
-- that share the same Withings meastype within one measure group.
ALTER TABLE "WithingsMeasurement" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Replace the (grpid, type) uniqueness with (grpid, type, position) so segmental
-- values are no longer collapsed to a single row.
DROP INDEX "WithingsMeasurement_grpid_type_key";

CREATE UNIQUE INDEX "WithingsMeasurement_grpid_type_position_key" ON "WithingsMeasurement"("grpid", "type", "position");
