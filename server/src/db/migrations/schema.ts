import { pgTable, uuid, varchar, text, boolean, timestamp, integer, unique, date, time, jsonb, foreignKey, numeric, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const authProvider = pgEnum("auth_provider", ['email', 'google', 'apple'])
export const blogStatus = pgEnum("blog_status", ['draft', 'published', 'archived'])
export const callStatus = pgEnum("call_status", ['initiated', 'ongoing', 'completed', 'missed', 'cancelled'])
export const callType = pgEnum("call_type", ['audio', 'video'])
export const commissionType = pgEnum("commission_type", ['percentage', 'fixed'])
export const gender = pgEnum("gender", ['male', 'female', 'other'])
export const messageType = pgEnum("message_type", ['text', 'image', 'voice', 'file'])
export const notificationType = pgEnum("notification_type", ['system', 'promotional', 'transactional', 'reminder'])
export const onlineStatus = pgEnum("online_status", ['online', 'offline', 'busy'])
export const reportReason = pgEnum("report_reason", ['spam', 'harassment', 'fake_profile', 'inappropriate', 'other'])
export const transactionCategory = pgEnum("transaction_category", ['add_funds', 'withdrawal', 'call_charge', 'chat_charge', 'gift', 'donation', 'commission', 'order_payment', 'refund'])
export const transactionStatus = pgEnum("transaction_status", ['pending', 'success', 'failed', 'refunded'])
export const transactionType = pgEnum("transaction_type", ['credit', 'debit'])
export const userRole = pgEnum("user_role", ['user', 'astrologer', 'admin'])
export const verificationStatus = pgEnum("verification_status", ['pending', 'approved', 'rejected'])
export const withdrawalStatus = pgEnum("withdrawal_status", ['pending', 'approved', 'rejected', 'completed'])


export const apiKeys = pgTable("api_keys", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	provider: varchar({ length: 100 }).notNull(),
	keyName: varchar("key_name", { length: 100 }).notNull(),
	apiKey: text("api_key").notNull(),
	apiSecret: text("api_secret"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const appReleases = pgTable("app_releases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	appName: varchar("app_name", { length: 50 }).notNull(),
	platform: varchar({ length: 20 }).notNull(),
	version: varchar({ length: 20 }).notNull(),
	buildNumber: integer("build_number").notNull(),
	releaseNotes: text("release_notes"),
	downloadUrl: text("download_url"),
	isMandatory: boolean("is_mandatory").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	releasedAt: timestamp("released_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const blogs = pgTable("blogs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	excerpt: text(),
	coverImage: text("cover_image"),
	authorId: uuid("author_id"),
	authorRole: userRole("author_role"),
	status: blogStatus().default('draft').notNull(),
	tags: text().array().default([""]).notNull(),
	viewCount: integer("view_count").default(0).notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("blogs_slug_unique").on(table.slug),
]);

export const horoscopeRecords = pgTable("horoscope_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	zodiacSign: varchar("zodiac_sign", { length: 20 }).notNull(),
	date: date().notNull(),
	prediction: text().notNull(),
	luckyNumber: integer("lucky_number"),
	luckyColor: varchar("lucky_color", { length: 50 }),
	mood: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const news = pgTable("news", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	image: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const panchangRecords = pgTable("panchang_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: date().notNull(),
	tithi: varchar({ length: 100 }),
	nakshatra: varchar({ length: 100 }),
	yoga: varchar({ length: 100 }),
	karana: varchar({ length: 100 }),
	sunrise: time(),
	sunset: time(),
	moonrise: time(),
	moonset: time(),
	rahuKaal: jsonb("rahu_kaal"),
	data: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("panchang_records_date_unique").on(table.date),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	password: varchar({ length: 255 }),
	avatar: text(),
	gender: gender(),
	dateOfBirth: date("date_of_birth"),
	authProvider: authProvider("auth_provider").default('email').notNull(),
	authProviderId: varchar("auth_provider_id", { length: 255 }),
	fcmToken: text("fcm_token"),
	isActive: boolean("is_active").default(true).notNull(),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_phone_unique").on(table.phone),
]);

export const videos = pgTable("videos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	url: text().notNull(),
	thumbnail: text(),
	category: varchar({ length: 100 }),
	duration: integer(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const admins = pgTable("admins", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).default('admin').notNull(),
	avatar: text(),
	isActive: boolean("is_active").default(true).notNull(),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("admins_email_unique").on(table.email),
]);

export const appSettings = pgTable("app_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: jsonb().notNull(),
	description: text(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [admins.id],
			name: "app_settings_updated_by_admins_id_fk"
		}).onDelete("set null"),
	unique("app_settings_key_unique").on(table.key),
]);

export const astrologerSchedules = pgTable("astrologer_schedules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	astrologerId: uuid("astrologer_id").notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	isAvailable: boolean("is_available").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.astrologerId],
			foreignColumns: [astrologers.id],
			name: "astrologer_schedules_astrologer_id_astrologers_id_fk"
		}).onDelete("cascade"),
]);

export const commissions = pgTable("commissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	astrologerId: uuid("astrologer_id").notNull(),
	type: commissionType().default('percentage').notNull(),
	value: numeric({ precision: 5, scale:  2 }).notNull(),
	minAmount: numeric("min_amount", { precision: 10, scale:  2 }),
	maxCap: numeric("max_cap", { precision: 10, scale:  2 }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.astrologerId],
			foreignColumns: [astrologers.id],
			name: "commissions_astrologer_id_astrologers_id_fk"
		}).onDelete("cascade"),
	unique("commissions_astrologer_id_unique").on(table.astrologerId),
]);

export const dynamicLinks = pgTable("dynamic_links", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pageName: varchar("page_name", { length: 100 }).notNull(),
	url: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [admins.id],
			name: "dynamic_links_updated_by_admins_id_fk"
		}).onDelete("set null"),
	unique("dynamic_links_page_name_unique").on(table.pageName),
]);

export const gifts = pgTable("gifts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	image: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const callLogs = pgTable("call_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	astrologerId: uuid("astrologer_id").notNull(),
	userId: uuid("user_id").notNull(),
	type: callType().notNull(),
	status: callStatus().default('initiated').notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	endedAt: timestamp("ended_at", { mode: 'string' }),
	duration: integer(),
	cost: numeric({ precision: 10, scale:  2 }),
	ratePerMin: numeric("rate_per_min", { precision: 10, scale:  2 }),
	agoraChannel: varchar("agora_channel", { length: 255 }),
	agoraToken: text("agora_token"),
	recordingUrl: text("recording_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.astrologerId],
			foreignColumns: [astrologers.id],
			name: "call_logs_astrologer_id_astrologers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "call_logs_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const donations = pgTable("donations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	transactionId: uuid("transaction_id"),
	message: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "donations_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.transactionId],
			foreignColumns: [transactions.id],
			name: "donations_transaction_id_transactions_id_fk"
		}).onDelete("set null"),
]);

export const transactions = pgTable("transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	walletId: uuid("wallet_id").notNull(),
	userId: uuid("user_id"),
	astrologerId: uuid("astrologer_id"),
	type: transactionType().notNull(),
	category: transactionCategory().notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	fee: numeric({ precision: 12, scale:  2 }).default('0').notNull(),
	netAmount: numeric("net_amount", { precision: 12, scale:  2 }).notNull(),
	status: transactionStatus().default('pending').notNull(),
	referenceId: varchar("reference_id", { length: 255 }),
	gatewayResponse: jsonb("gateway_response"),
	description: text(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.walletId],
			foreignColumns: [wallets.id],
			name: "transactions_wallet_id_wallets_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "transactions_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.astrologerId],
			foreignColumns: [astrologers.id],
			name: "transactions_astrologer_id_astrologers_id_fk"
		}).onDelete("set null"),
]);

export const astrologers = pgTable("astrologers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	password: varchar({ length: 255 }),
	avatar: text(),
	gender: gender(),
	dateOfBirth: date("date_of_birth"),
	authProvider: authProvider("auth_provider").default('email').notNull(),
	authProviderId: varchar("auth_provider_id", { length: 255 }),
	bio: text(),
	experience: integer().default(0).notNull(),
	specialization: text().array().default([""]).notNull(),
	languages: text().array().default([""]).notNull(),
	skills: text().array().default([""]).notNull(),
	pricePerMin: numeric("price_per_min", { precision: 10, scale:  2 }).default('0').notNull(),
	rating: numeric({ precision: 3, scale:  2 }).default('0').notNull(),
	totalReviews: integer("total_reviews").default(0).notNull(),
	totalCalls: integer("total_calls").default(0).notNull(),
	totalEarnings: numeric("total_earnings", { precision: 12, scale:  2 }).default('0').notNull(),
	verificationStatus: verificationStatus("verification_status").default('pending').notNull(),
	verificationDoc: text("verification_doc").array(),
	verificationNote: text("verification_note"),
	onlineStatus: onlineStatus("online_status").default('offline').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	fcmToken: text("fcm_token"),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	chatPricePerMin: numeric("chat_price_per_min", { precision: 10, scale:  2 }).default('0').notNull(),
	audioCallPricePerMin: numeric("audio_call_price_per_min", { precision: 10, scale:  2 }).default('0').notNull(),
	videoCallPricePerMin: numeric("video_call_price_per_min", { precision: 10, scale:  2 }).default('0').notNull(),
	totalChats: integer("total_chats").default(0).notNull(),
	totalAudioCalls: integer("total_audio_calls").default(0).notNull(),
	totalVideoCalls: integer("total_video_calls").default(0).notNull(),
}, (table) => [
	unique("astrologers_email_unique").on(table.email),
	unique("astrologers_phone_unique").on(table.phone),
]);

export const liveSessions = pgTable("live_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	astrologerId: uuid("astrologer_id").notNull(),
	title: varchar({ length: 255 }),
	thumbnail: text(),
	status: varchar({ length: 50 }).default('scheduled').notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	startedAt: timestamp("started_at", { mode: 'string' }),
	endedAt: timestamp("ended_at", { mode: 'string' }),
	viewerCount: integer("viewer_count").default(0).notNull(),
	maxViewers: integer("max_viewers"),
	agoraChannel: varchar("agora_channel", { length: 255 }),
	agoraToken: text("agora_token"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.astrologerId],
			foreignColumns: [astrologers.id],
			name: "live_sessions_astrologer_id_astrologers_id_fk"
		}).onDelete("cascade"),
]);

export const shopProducts = pgTable("shop_products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	comparePrice: numeric("compare_price", { precision: 10, scale:  2 }),
	images: text().array().default([""]).notNull(),
	category: varchar({ length: 100 }),
	stock: integer().default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const mandirPooja = pgTable("mandir_pooja", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	image: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const websiteContent = pgTable("website_content", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	section: varchar({ length: 100 }).notNull(),
	content: jsonb().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [admins.id],
			name: "website_content_updated_by_admins_id_fk"
		}).onDelete("set null"),
	unique("website_content_section_unique").on(table.section),
]);

export const withdrawalRequests = pgTable("withdrawal_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	astrologerId: uuid("astrologer_id").notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	status: withdrawalStatus().default('pending').notNull(),
	bankAccount: jsonb("bank_account").notNull(),
	adminNote: text("admin_note"),
	processedBy: uuid("processed_by"),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.astrologerId],
			foreignColumns: [astrologers.id],
			name: "withdrawal_requests_astrologer_id_astrologers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.processedBy],
			foreignColumns: [admins.id],
			name: "withdrawal_requests_processed_by_admins_id_fk"
		}).onDelete("set null"),
]);

export const giftTransactions = pgTable("gift_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	giftId: uuid("gift_id").notNull(),
	senderId: uuid("sender_id").notNull(),
	receiverId: uuid("receiver_id").notNull(),
	transactionId: uuid("transaction_id"),
	isRedeemed: boolean("is_redeemed").default(false).notNull(),
	redeemedAt: timestamp("redeemed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.giftId],
			foreignColumns: [gifts.id],
			name: "gift_transactions_gift_id_gifts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "gift_transactions_sender_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [astrologers.id],
			name: "gift_transactions_receiver_id_astrologers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.transactionId],
			foreignColumns: [transactions.id],
			name: "gift_transactions_transaction_id_transactions_id_fk"
		}).onDelete("set null"),
]);

export const conversations = pgTable("conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	participantOneId: uuid("participant_one_id").notNull(),
	participantOneRole: userRole("participant_one_role").notNull(),
	participantTwoId: uuid("participant_two_id").notNull(),
	participantTwoRole: userRole("participant_two_role").notNull(),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }),
	lastMessagePreview: varchar("last_message_preview", { length: 200 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_conversations_p1_lastmsg").using("btree", table.participantOneId.asc().nullsLast().op("uuid_ops"), table.lastMessageAt.desc().nullsLast().op("timestamp_ops")),
	index("idx_conversations_p2_lastmsg").using("btree", table.participantTwoId.asc().nullsLast().op("timestamp_ops"), table.lastMessageAt.desc().nullsLast().op("uuid_ops")),
	uniqueIndex("unique_participants").using("btree", table.participantOneId.asc().nullsLast().op("uuid_ops"), table.participantTwoId.asc().nullsLast().op("uuid_ops")),
]);

export const conversationMessages = pgTable("conversation_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id").notNull(),
	senderId: uuid("sender_id").notNull(),
	senderRole: userRole("sender_role").notNull(),
	type: messageType().default('text').notNull(),
	content: text(),
	mediaUrl: text("media_url"),
	isDelivered: boolean("is_delivered").default(false).notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_conv_messages_conv_created").using("btree", table.conversationId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsLast().op("uuid_ops")),
	index("idx_conv_messages_unread").using("btree", table.conversationId.asc().nullsLast().op("bool_ops"), table.isRead.asc().nullsLast().op("bool_ops")).where(sql`(is_read = false)`),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "conversation_messages_conversation_id_conversations_id_fk"
		}).onDelete("cascade"),
]);

export const kundliRecords = pgTable("kundli_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	gender: gender().notNull(),
	dateOfBirth: date("date_of_birth").notNull(),
	timeOfBirth: time("time_of_birth").notNull(),
	placeOfBirth: varchar("place_of_birth", { length: 255 }).notNull(),
	latitude: numeric({ precision: 10, scale:  7 }),
	longitude: numeric({ precision: 10, scale:  7 }),
	timezone: varchar({ length: 50 }),
	chartData: jsonb("chart_data"),
	planetaryPositions: jsonb("planetary_positions"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "kundli_records_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const matchmakingRecords = pgTable("matchmaking_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	person1Name: varchar("person1_name", { length: 255 }).notNull(),
	person1Dob: date("person1_dob").notNull(),
	person1Tob: time("person1_tob").notNull(),
	person1Place: varchar("person1_place", { length: 255 }).notNull(),
	person2Name: varchar("person2_name", { length: 255 }).notNull(),
	person2Dob: date("person2_dob").notNull(),
	person2Tob: time("person2_tob").notNull(),
	person2Place: varchar("person2_place", { length: 255 }).notNull(),
	matchScore: integer("match_score"),
	matchDetails: jsonb("match_details"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "matchmaking_records_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	astrologerId: uuid("astrologer_id"),
	type: notificationType().notNull(),
	title: varchar({ length: 255 }).notNull(),
	body: text().notNull(),
	data: jsonb(),
	isRead: boolean("is_read").default(false).notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.astrologerId],
			foreignColumns: [astrologers.id],
			name: "notifications_astrologer_id_astrologers_id_fk"
		}).onDelete("cascade"),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	shippingAddress: jsonb("shipping_address"),
	transactionId: uuid("transaction_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.transactionId],
			foreignColumns: [transactions.id],
			name: "orders_transaction_id_transactions_id_fk"
		}).onDelete("set null"),
]);

export const poojaBookings = pgTable("pooja_bookings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	poojaId: uuid("pooja_id").notNull(),
	bookingDate: date("booking_date").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	transactionId: uuid("transaction_id"),
	status: varchar({ length: 50 }).default('pending').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "pooja_bookings_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.poojaId],
			foreignColumns: [mandirPooja.id],
			name: "pooja_bookings_pooja_id_mandir_pooja_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.transactionId],
			foreignColumns: [transactions.id],
			name: "pooja_bookings_transaction_id_transactions_id_fk"
		}).onDelete("set null"),
]);

export const reports = pgTable("reports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reporterId: uuid("reporter_id").notNull(),
	reporterRole: userRole("reporter_role").notNull(),
	reportedUserId: uuid("reported_user_id"),
	reportedAstrologerId: uuid("reported_astrologer_id"),
	reason: reportReason().notNull(),
	description: text(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	resolvedBy: uuid("resolved_by"),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.reportedUserId],
			foreignColumns: [users.id],
			name: "reports_reported_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.reportedAstrologerId],
			foreignColumns: [astrologers.id],
			name: "reports_reported_astrologer_id_astrologers_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.resolvedBy],
			foreignColumns: [admins.id],
			name: "reports_resolved_by_admins_id_fk"
		}).onDelete("set null"),
]);

export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	astrologerId: uuid("astrologer_id").notNull(),
	rating: integer().notNull(),
	comment: text(),
	callId: uuid("call_id"),
	isVisible: boolean("is_visible").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.astrologerId],
			foreignColumns: [astrologers.id],
			name: "reviews_astrologer_id_astrologers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.callId],
			foreignColumns: [callLogs.id],
			name: "reviews_call_id_call_logs_id_fk"
		}).onDelete("set null"),
]);

export const supportTickets = pgTable("support_tickets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	astrologerId: uuid("astrologer_id"),
	subject: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	status: varchar({ length: 50 }).default('open').notNull(),
	priority: varchar({ length: 20 }).default('normal').notNull(),
	assignedTo: uuid("assigned_to"),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "support_tickets_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.astrologerId],
			foreignColumns: [astrologers.id],
			name: "support_tickets_astrologer_id_astrologers_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [admins.id],
			name: "support_tickets_assigned_to_admins_id_fk"
		}).onDelete("set null"),
]);

export const wallets = pgTable("wallets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	astrologerId: uuid("astrologer_id"),
	balance: numeric({ precision: 12, scale:  2 }).default('0').notNull(),
	totalAdded: numeric("total_added", { precision: 12, scale:  2 }).default('0').notNull(),
	totalDeducted: numeric("total_deducted", { precision: 12, scale:  2 }).default('0').notNull(),
	currency: varchar({ length: 10 }).default('INR').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wallets_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.astrologerId],
			foreignColumns: [astrologers.id],
			name: "wallets_astrologer_id_astrologers_id_fk"
		}).onDelete("cascade"),
]);

export const paymentOrders = pgTable("payment_orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	razorpayOrderId: varchar("razorpay_order_id", { length: 100 }),
	razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }),
	razorpaySignature: varchar("razorpay_signature", { length: 255 }),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	currency: varchar({ length: 10 }).default('INR').notNull(),
	purpose: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 30 }).default('created').notNull(),
	failedReason: varchar("failed_reason", { length: 255 }),
	metadata: jsonb().default({}).notNull(),
	transactionId: uuid("transaction_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "payment_orders_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.transactionId],
			foreignColumns: [transactions.id],
			name: "payment_orders_transaction_id_transactions_id_fk"
		}).onDelete("set null"),
	unique("payment_orders_razorpay_order_id_unique").on(table.razorpayOrderId),
]);

export const chatMessages = pgTable("chat_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	callId: uuid("call_id").notNull(),
	senderId: uuid("sender_id").notNull(),
	senderRole: userRole("sender_role").notNull(),
	type: messageType().default('text').notNull(),
	content: text(),
	mediaUrl: text("media_url"),
	duration: integer(),
	isRead: boolean("is_read").default(false).notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.callId],
			foreignColumns: [callLogs.id],
			name: "chat_messages_call_id_call_logs_id_fk"
		}).onDelete("cascade"),
]);

export const commissionLogs = pgTable("commission_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	astrologerId: uuid("astrologer_id").notNull(),
	transactionId: uuid("transaction_id"),
	callId: uuid("call_id"),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	percentage: numeric({ precision: 5, scale:  2 }).notNull(),
	totalEarned: numeric("total_earned", { precision: 12, scale:  2 }).notNull(),
	platformFee: numeric("platform_fee", { precision: 12, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.astrologerId],
			foreignColumns: [astrologers.id],
			name: "commission_logs_astrologer_id_astrologers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.transactionId],
			foreignColumns: [transactions.id],
			name: "commission_logs_transaction_id_transactions_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.callId],
			foreignColumns: [callLogs.id],
			name: "commission_logs_call_id_call_logs_id_fk"
		}).onDelete("set null"),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productId: uuid("product_id").notNull(),
	quantity: integer().default(1).notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	totalPrice: numeric("total_price", { precision: 12, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [shopProducts.id],
			name: "order_items_product_id_shop_products_id_fk"
		}).onDelete("cascade"),
]);

export const ticketReplies = pgTable("ticket_replies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ticketId: uuid("ticket_id").notNull(),
	senderId: uuid("sender_id").notNull(),
	senderRole: userRole("sender_role").notNull(),
	message: text().notNull(),
	attachments: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [supportTickets.id],
			name: "ticket_replies_ticket_id_support_tickets_id_fk"
		}).onDelete("cascade"),
]);

export const paymentEvents = pgTable("payment_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	paymentOrderId: uuid("payment_order_id"),
	eventId: varchar("event_id", { length: 100 }),
	eventType: varchar("event_type", { length: 100 }).notNull(),
	razorpayEventId: varchar("razorpay_event_id", { length: 100 }),
	payload: jsonb().notNull(),
	status: varchar({ length: 20 }).default('received').notNull(),
	errorMessage: text("error_message"),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.paymentOrderId],
			foreignColumns: [paymentOrders.id],
			name: "payment_events_payment_order_id_payment_orders_id_fk"
		}).onDelete("set null"),
	unique("payment_events_event_id_unique").on(table.eventId),
]);

export const muhuratCategories = pgTable("muhurat_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("muhurat_categories_name_unique").on(table.name),
]);

export const muhurat = pgTable("muhurat", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	date: date().notNull(),
	time: time().notNull(),
	description: text(),
	createdBy: uuid("created_by"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("unique_date_time").using("btree", table.date.asc().nullsLast().op("date_ops"), table.time.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [muhuratCategories.id],
			name: "muhurat_category_id_muhurat_categories_id_fk"
		}).onDelete("cascade"),
]);

export const feedback = pgTable("feedback", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	astrologerId: uuid("astrologer_id").notNull(),
	userId: uuid("user_id").notNull(),
	ratings: numeric({ precision: 2, scale:  1 }).notNull(),
	comments: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.astrologerId],
			foreignColumns: [astrologers.id],
			name: "feedback_astrologer_id_astrologers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "feedback_user_id_users_id_fk"
		}).onDelete("set null"),
]);
