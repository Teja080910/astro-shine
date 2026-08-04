CREATE TABLE "favorite_astrologers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"astrologer_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "astrologers" ADD COLUMN "is_chat_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "astrologers" ADD COLUMN "is_audio_call_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "astrologers" ADD COLUMN "is_video_call_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "favorite_astrologers" ADD CONSTRAINT "favorite_astrologers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_astrologers" ADD CONSTRAINT "favorite_astrologers_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_astrologer_unique_idx" ON "favorite_astrologers" USING btree ("user_id","astrologer_id");