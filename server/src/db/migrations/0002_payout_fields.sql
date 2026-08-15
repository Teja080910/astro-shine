ALTER TABLE "withdrawal_requests" ADD COLUMN "payout_id" varchar(100);--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD COLUMN "payout_utr" varchar(100);--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD COLUMN "payout_status" varchar(50);--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD COLUMN "payout_response" jsonb;
