-- Migration: allow multiple translations per entry (one per locale)
-- Existing rows all have locale='en' and entryId is already unique,
-- so adding the composite unique index is safe without data changes.

-- Drop old single-column unique index on entryId
DROP INDEX IF EXISTS "Translation_entryId_key";

-- Add composite unique index on (entryId, locale)
CREATE UNIQUE INDEX "Translation_entryId_locale_key" ON "Translation"("entryId", "locale");
