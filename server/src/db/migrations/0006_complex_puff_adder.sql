ALTER TABLE "withdrawal_requests" ALTER COLUMN "astrologer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ALTER COLUMN "bank_account" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD COLUMN "admin_id" uuid;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;