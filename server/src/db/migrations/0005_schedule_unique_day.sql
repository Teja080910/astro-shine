-- One schedule row per astrologer per weekday.
-- The table previously had no unique constraint, so repeated saves could create
-- duplicate rows for the same day and the schedule screen would show whichever
-- row came back last.
--
-- De-duplicate first (keep the most recently updated row per astrologer/day),
-- then enforce the constraint the service already assumes.

DELETE FROM "astrologer_schedules" a
USING "astrologer_schedules" b
WHERE a."astrologer_id" = b."astrologer_id"
  AND a."day_of_week" = b."day_of_week"
  AND (
    a."updated_at" < b."updated_at"
    OR (a."updated_at" = b."updated_at" AND a."id" < b."id")
  );
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "astrologer_schedules_astrologer_day_uq"
  ON "astrologer_schedules" ("astrologer_id", "day_of_week");
