-- Split the platform commission into an explicit TDS component.
--
-- Business rule change: the platform now retains 30% of every consultation,
-- made up of a 20% platform fee plus 10% TDS withheld on the astrologer's
-- gross earning. Only the remaining 70% is credited to the astrologer.
--
-- `percentage` on commission_logs keeps meaning "total withheld from the
-- astrologer" (now 30), and the two new columns record how that 30 breaks
-- down so reporting and TDS filing can use it directly.

ALTER TABLE "commission_logs"
  ADD COLUMN IF NOT EXISTS "platform_fee_percentage" numeric(5,2) NOT NULL DEFAULT '20.00';

ALTER TABLE "commission_logs"
  ADD COLUMN IF NOT EXISTS "tds_percentage" numeric(5,2) NOT NULL DEFAULT '10.00';

ALTER TABLE "commission_logs"
  ADD COLUMN IF NOT EXISTS "tds_amount" numeric(12,2) NOT NULL DEFAULT '0';

-- Backfill historic rows so reports stay internally consistent: treat the
-- whole previously-deducted fee as the platform fee, with no TDS.
UPDATE "commission_logs"
SET "platform_fee_percentage" = "percentage",
    "tds_percentage" = 0,
    "tds_amount" = 0
WHERE "created_at" < now();

-- Align existing per-astrologer commission rows with the new default. Rows
-- that were already explicitly configured are left untouched.
UPDATE "commissions"
SET "value" = '30.00', "updated_at" = now()
WHERE "is_active" = true AND "value" < '30.00';

-- Persist the platform defaults so the admin UI can display them and new
-- astrologers inherit the right split.
INSERT INTO "app_settings" ("key", "value", "description")
VALUES
  ('platform_fee_percentage', '20'::jsonb, 'Platform fee withheld from each consultation'),
  ('tds_percentage', '10'::jsonb, 'TDS withheld from each astrologer payout (section 194J)'),
  ('total_commission_percentage', '30'::jsonb, 'Combined platform fee + TDS withheld from astrologers')
ON CONFLICT ("key") DO UPDATE
SET "value" = EXCLUDED."value",
    "description" = EXCLUDED."description";
