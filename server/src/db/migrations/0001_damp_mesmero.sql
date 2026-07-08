CREATE TABLE "conversation_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_role" "user_role" NOT NULL,
	"type" "message_type" DEFAULT 'text' NOT NULL,
	"content" text,
	"media_url" text,
	"is_delivered" boolean DEFAULT false NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_one_id" uuid NOT NULL,
	"participant_one_role" "user_role" NOT NULL,
	"participant_two_id" uuid NOT NULL,
	"participant_two_role" "user_role" NOT NULL,
	"last_message_at" timestamp,
	"last_message_preview" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_conv_messages_conv_created" ON "conversation_messages" USING btree ("conversation_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_conv_messages_unread" ON "conversation_messages" USING btree ("conversation_id","is_read") WHERE "conversation_messages"."is_read" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_participants" ON "conversations" USING btree ("participant_one_id","participant_two_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_p1_lastmsg" ON "conversations" USING btree ("participant_one_id","last_message_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_conversations_p2_lastmsg" ON "conversations" USING btree ("participant_two_id","last_message_at" DESC NULLS LAST);