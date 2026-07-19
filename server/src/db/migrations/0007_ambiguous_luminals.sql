CREATE TABLE "donation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"admin_id" uuid,
	"type" varchar(20) DEFAULT 'received' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "donation_logs" ADD CONSTRAINT "donation_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_logs" ADD CONSTRAINT "donation_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;