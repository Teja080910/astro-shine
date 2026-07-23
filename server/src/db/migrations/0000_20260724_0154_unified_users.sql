CREATE TYPE "user_role" AS ENUM ('user', 'astrologer', 'admin');
--> statement-breakpoint
CREATE TYPE "auth_provider" AS ENUM ('email', 'google', 'apple');
--> statement-breakpoint
CREATE TYPE "gender" AS ENUM ('male', 'female', 'other');
--> statement-breakpoint
CREATE TYPE "verification_status" AS ENUM ('pending', 'approved', 'rejected');
--> statement-breakpoint
CREATE TYPE "online_status" AS ENUM ('online', 'offline', 'busy');
--> statement-breakpoint
CREATE TYPE "transaction_type" AS ENUM ('credit', 'debit');
--> statement-breakpoint
CREATE TYPE "transaction_status" AS ENUM ('pending', 'success', 'failed', 'refunded');
--> statement-breakpoint
CREATE TYPE "transaction_category" AS ENUM ('add_funds', 'withdrawal', 'call_charge', 'chat_charge', 'gift', 'donation', 'commission', 'order_payment', 'refund');
--> statement-breakpoint
CREATE TYPE "withdrawal_status" AS ENUM ('pending', 'approved', 'rejected', 'completed');
--> statement-breakpoint
CREATE TYPE "commission_type" AS ENUM ('percentage', 'fixed');
--> statement-breakpoint
CREATE TYPE "call_status" AS ENUM ('initiated', 'ongoing', 'completed', 'missed', 'cancelled', 'failed');
--> statement-breakpoint
CREATE TYPE "call_type" AS ENUM ('audio', 'video');
--> statement-breakpoint
CREATE TYPE "message_type" AS ENUM ('text', 'image', 'voice', 'file');
--> statement-breakpoint
CREATE TYPE "blog_status" AS ENUM ('draft', 'published', 'archived');
--> statement-breakpoint
CREATE TYPE "report_reason" AS ENUM ('spam', 'harassment', 'fake_profile', 'inappropriate', 'other');
--> statement-breakpoint
CREATE TYPE "notification_type" AS ENUM ('system', 'promotional', 'transactional', 'reminder');
--> statement-breakpoint
CREATE TABLE "admins" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(100) NOT NULL,
	"key_name" varchar(100) NOT NULL,
	"api_key" text NOT NULL,
	"api_secret" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_name" varchar(50) NOT NULL,
	"platform" varchar(20) NOT NULL,
	"version" varchar(20) NOT NULL,
	"build_number" integer NOT NULL,
	"release_notes" text,
	"download_url" text,
	"is_mandatory" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"released_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "astrologer_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"astrologer_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "astrologers" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"bio" text,
	"experience" integer DEFAULT 0 NOT NULL,
	"specialization" text[] DEFAULT '{}' NOT NULL,
	"languages" text[] DEFAULT '{}' NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"price_per_min" numeric(10, 2) DEFAULT '0' NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"chat_price_per_min" numeric(10, 2) DEFAULT '0' NOT NULL,
	"audio_call_price_per_min" numeric(10, 2) DEFAULT '0' NOT NULL,
	"video_call_price_per_min" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_chats" integer DEFAULT 0 NOT NULL,
	"total_audio_calls" integer DEFAULT 0 NOT NULL,
	"total_video_calls" integer DEFAULT 0 NOT NULL,
	"total_calls" integer DEFAULT 0 NOT NULL,
	"total_earnings" numeric(12, 2) DEFAULT '0' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"verification_doc" text[],
	"verification_note" text,
	"online_status" "online_status" DEFAULT 'offline' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"cover_image" text,
	"author_id" uuid,
	"author_role" "user_role",
	"status" "blog_status" DEFAULT 'draft' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blogs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "call_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"astrologer_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "call_type" NOT NULL,
	"status" "call_status" DEFAULT 'initiated' NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"duration" integer,
	"cost" numeric(10, 2),
	"rate_per_min" numeric(10, 2),
	"agora_channel" varchar(255),
	"agora_token" text,
	"recording_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"call_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_role" "user_role" NOT NULL,
	"type" "message_type" DEFAULT 'text' NOT NULL,
	"content" text,
	"media_url" text,
	"duration" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"astrologer_id" uuid NOT NULL,
	"transaction_id" uuid,
	"call_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"total_earned" numeric(12, 2) NOT NULL,
	"platform_fee" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"astrologer_id" uuid NOT NULL,
	"type" "commission_type" DEFAULT 'percentage' NOT NULL,
	"value" numeric(5, 2) NOT NULL,
	"min_amount" numeric(10, 2),
	"max_cap" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "commissions_astrologer_id_unique" UNIQUE("astrologer_id")
);
--> statement-breakpoint
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
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"transaction_id" uuid,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dynamic_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_name" varchar(100) NOT NULL,
	"url" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dynamic_links_page_name_unique" UNIQUE("page_name")
);
--> statement-breakpoint
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
CREATE TABLE "gift_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gift_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"transaction_id" uuid,
	"is_redeemed" boolean DEFAULT false NOT NULL,
	"redeemed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" text,
	"price" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "horoscope_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zodiac_sign" varchar(20) NOT NULL,
	"date" date NOT NULL,
	"prediction" text NOT NULL,
	"lucky_number" integer,
	"lucky_color" varchar(50),
	"mood" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kundli_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"gender" "gender" NOT NULL,
	"date_of_birth" date NOT NULL,
	"time_of_birth" time NOT NULL,
	"place_of_birth" varchar(255) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"timezone" varchar(50),
	"chart_data" jsonb,
	"planetary_positions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"astrologer_id" uuid NOT NULL,
	"title" varchar(255),
	"thumbnail" text,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"ended_at" timestamp,
	"viewer_count" integer DEFAULT 0 NOT NULL,
	"max_viewers" integer,
	"agora_channel" varchar(255),
	"agora_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mandir_pooja" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image" text,
	"price" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matchmaking_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"person1_name" varchar(255) NOT NULL,
	"person1_dob" date NOT NULL,
	"person1_tob" time NOT NULL,
	"person1_place" varchar(255) NOT NULL,
	"person2_name" varchar(255) NOT NULL,
	"person2_dob" date NOT NULL,
	"person2_tob" time NOT NULL,
	"person2_place" varchar(255) NOT NULL,
	"match_score" integer,
	"match_details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "muhurat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"time" time NOT NULL,
	"description" text,
	"created_by" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "muhurat_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "muhurat_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"image" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"astrologer_id" uuid,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"shipping_address" jsonb,
	"transaction_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "panchang_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"tithi" varchar(100),
	"nakshatra" varchar(100),
	"yoga" varchar(100),
	"karana" varchar(100),
	"sunrise" time,
	"sunset" time,
	"moonrise" time,
	"moonset" time,
	"rahu_kaal" jsonb,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "panchang_records_date_unique" UNIQUE("date")
);
--> statement-breakpoint
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
CREATE TABLE "pooja_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pooja_id" uuid NOT NULL,
	"booking_date" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"transaction_id" uuid,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reporter_role" "user_role" NOT NULL,
	"reported_user_id" uuid,
	"reported_astrologer_id" uuid,
	"reason" "report_reason" NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"astrologer_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"call_id" uuid,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"compare_price" numeric(10, 2),
	"images" text[] DEFAULT '{}' NOT NULL,
	"category" varchar(100),
	"stock" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"astrologer_id" uuid,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"assigned_to" uuid,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_role" "user_role" NOT NULL,
	"message" text NOT NULL,
	"attachments" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"user_id" uuid,
	"astrologer_id" uuid,
	"type" "transaction_type" NOT NULL,
	"category" "transaction_category" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"fee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(12, 2) NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"reference_id" varchar(255),
	"gateway_response" jsonb,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"password" varchar(255),
	"avatar" text,
	"gender" "gender",
	"date_of_birth" date,
	"auth_provider" "auth_provider" DEFAULT 'email' NOT NULL,
	"auth_provider_id" varchar(255),
	"fcm_token" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"thumbnail" text,
	"category" varchar(100),
	"duration" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"astrologer_id" uuid,
	"admin_id" uuid,
	"balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_added" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_deducted" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "website_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section" varchar(100) NOT NULL,
	"content" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "website_content_section_unique" UNIQUE("section")
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"astrologer_id" uuid,
	"admin_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"status" "withdrawal_status" DEFAULT 'pending' NOT NULL,
	"bank_account" jsonb,
	"admin_note" text,
	"processed_by" uuid,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_admins_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "astrologer_schedules" ADD CONSTRAINT "astrologer_schedules_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "astrologers" ADD CONSTRAINT "astrologers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_call_id_call_logs_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."call_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_logs" ADD CONSTRAINT "commission_logs_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_logs" ADD CONSTRAINT "commission_logs_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_logs" ADD CONSTRAINT "commission_logs_call_id_call_logs_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."call_logs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_logs" ADD CONSTRAINT "donation_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_logs" ADD CONSTRAINT "donation_logs_admin_id_admins_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_links" ADD CONSTRAINT "dynamic_links_updated_by_admins_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_transactions" ADD CONSTRAINT "gift_transactions_gift_id_gifts_id_fk" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_transactions" ADD CONSTRAINT "gift_transactions_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_transactions" ADD CONSTRAINT "gift_transactions_receiver_id_astrologers_user_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."astrologers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_transactions" ADD CONSTRAINT "gift_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kundli_records" ADD CONSTRAINT "kundli_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchmaking_records" ADD CONSTRAINT "matchmaking_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "muhurat" ADD CONSTRAINT "muhurat_category_id_muhurat_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."muhurat_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_shop_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."payment_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pooja_bookings" ADD CONSTRAINT "pooja_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pooja_bookings" ADD CONSTRAINT "pooja_bookings_pooja_id_mandir_pooja_id_fk" FOREIGN KEY ("pooja_id") REFERENCES "public"."mandir_pooja"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pooja_bookings" ADD CONSTRAINT "pooja_bookings_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("reported_astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_admins_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."admins"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_call_id_call_logs_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."call_logs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_admins_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."admins"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_replies" ADD CONSTRAINT "ticket_replies_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_admin_id_admins_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_content" ADD CONSTRAINT "website_content_updated_by_admins_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_astrologer_id_astrologers_user_id_fk" FOREIGN KEY ("astrologer_id") REFERENCES "public"."astrologers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_admin_id_admins_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_processed_by_admins_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."admins"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_conv_messages_conv_created" ON "conversation_messages" USING btree ("conversation_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_conv_messages_unread" ON "conversation_messages" USING btree ("conversation_id","is_read") WHERE "conversation_messages"."is_read" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_participants" ON "conversations" USING btree ("participant_one_id","participant_two_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_p1_lastmsg" ON "conversations" USING btree ("participant_one_id","last_message_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_conversations_p2_lastmsg" ON "conversations" USING btree ("participant_two_id","last_message_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "unique_date_time" ON "muhurat" USING btree ("date","time");