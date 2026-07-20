CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_order_id" uuid,
	"event_id" varchar(100),
	"event_type" varchar(100) NOT NULL,
	"razorpay_event_id" varchar(100),
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'received' NOT NULL,
	"error_message" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"razorpay_order_id" varchar(100),
	"razorpay_payment_id" varchar(100),
	"razorpay_signature" varchar(255),
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"purpose" varchar(50) NOT NULL,
	"status" varchar(30) DEFAULT 'created' NOT NULL,
	"failed_reason" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"transaction_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_orders_razorpay_order_id_unique" UNIQUE("razorpay_order_id")
);
--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."payment_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;