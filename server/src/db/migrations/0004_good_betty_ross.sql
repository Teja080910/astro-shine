CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"astrologer_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"ratings" numeric(2, 1) NOT NULL,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "astrologers" ADD COLUMN "chat_price_per_min" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "astrologers" ADD COLUMN "audio_call_price_per_min" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "astrologers" ADD COLUMN "video_call_price_per_min" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "astrologers" ADD COLUMN "total_chats" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "astrologers" ADD COLUMN "total_audio_calls" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "astrologers" ADD COLUMN "total_video_calls" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_astrologer_id_astrologers_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;