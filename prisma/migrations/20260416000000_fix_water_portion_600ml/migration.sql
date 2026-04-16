-- Fix: correct water portion from 500ml to 600ml
-- Update all existing WATER entries that were logged with the old 500ml constant
UPDATE "DrinkLog"
SET "volume" = 600
WHERE "type" = 'WATER' AND "volume" = 500;
