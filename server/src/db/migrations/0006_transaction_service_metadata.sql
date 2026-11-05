-- Backfill the service behind historical wallet rows.
--
-- Astrologer credits were all stored as category='commission' and call charges
-- as category='call_charge', with no record of which service produced them.
-- Both link back to call_logs through reference_id, so the real call type can
-- be recovered exactly. Rows that cannot be resolved are left untouched and the
-- app falls back to parsing the description.

UPDATE "transactions" t
SET "metadata" = COALESCE(t."metadata", '{}'::jsonb) || jsonb_build_object(
      'serviceType',
      CASE cl."type" WHEN 'video' THEN 'video_call' ELSE 'audio_call' END,
      'callId',
      cl."id"
    ),
    "updated_at" = now()
FROM "call_logs" cl
WHERE cl."id"::text = t."reference_id"
  AND t."category" IN ('commission', 'call_charge')
  AND COALESCE(t."metadata"->>'serviceType', '') = '';
--> statement-breakpoint

-- Call charges already carried callType for newer rows; make sure older ones do.
UPDATE "transactions" t
SET "metadata" = COALESCE(t."metadata", '{}'::jsonb) || jsonb_build_object('callType', cl."type"),
    "updated_at" = now()
FROM "call_logs" cl
WHERE cl."id"::text = t."reference_id"
  AND t."category" = 'call_charge'
  AND COALESCE(t."metadata"->>'callType', '') = '';
