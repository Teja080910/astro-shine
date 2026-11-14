-- Allow a Kundli chart to be shared as a first-class chat message.
--
-- Previously the chat "share Kundli" action sent the birth details as plain
-- text, so no chart was ever generated and the astrologer only saw a few lines
-- of text. A dedicated message type lets the client render the chart inline and
-- lets the billing gate recognise a shared Kundli on the server.

ALTER TYPE "message_type" ADD VALUE IF NOT EXISTS 'kundli';

-- Rich message payload. A shared Kundli carries the computed chart here so the
-- client can render it inline without re-calling the astrology API.
ALTER TABLE "conversation_messages"
  ADD COLUMN IF NOT EXISTS "metadata" jsonb;
