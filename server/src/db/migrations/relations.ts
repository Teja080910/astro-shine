import { relations } from "drizzle-orm/relations";
import { admins, appSettings, astrologers, astrologerSchedules, commissions, dynamicLinks, callLogs, users, donations, transactions, wallets, liveSessions, websiteContent, withdrawalRequests, gifts, giftTransactions, conversations, conversationMessages, kundliRecords, matchmakingRecords, notifications, orders, poojaBookings, mandirPooja, reports, reviews, supportTickets, paymentOrders, chatMessages, commissionLogs, orderItems, shopProducts, ticketReplies, paymentEvents, muhuratCategories, muhurat, feedback } from "./schema";

export const appSettingsRelations = relations(appSettings, ({one}) => ({
	admin: one(admins, {
		fields: [appSettings.updatedBy],
		references: [admins.id]
	}),
}));

export const adminsRelations = relations(admins, ({many}) => ({
	appSettings: many(appSettings),
	dynamicLinks: many(dynamicLinks),
	websiteContents: many(websiteContent),
	withdrawalRequests: many(withdrawalRequests),
	reports: many(reports),
	supportTickets: many(supportTickets),
}));

export const astrologerSchedulesRelations = relations(astrologerSchedules, ({one}) => ({
	astrologer: one(astrologers, {
		fields: [astrologerSchedules.astrologerId],
		references: [astrologers.id]
	}),
}));

export const astrologersRelations = relations(astrologers, ({many}) => ({
	astrologerSchedules: many(astrologerSchedules),
	commissions: many(commissions),
	callLogs: many(callLogs),
	transactions: many(transactions),
	liveSessions: many(liveSessions),
	withdrawalRequests: many(withdrawalRequests),
	giftTransactions: many(giftTransactions),
	notifications: many(notifications),
	reports: many(reports),
	reviews: many(reviews),
	supportTickets: many(supportTickets),
	wallets: many(wallets),
	commissionLogs: many(commissionLogs),
	feedbacks: many(feedback),
}));

export const commissionsRelations = relations(commissions, ({one}) => ({
	astrologer: one(astrologers, {
		fields: [commissions.astrologerId],
		references: [astrologers.id]
	}),
}));

export const dynamicLinksRelations = relations(dynamicLinks, ({one}) => ({
	admin: one(admins, {
		fields: [dynamicLinks.updatedBy],
		references: [admins.id]
	}),
}));

export const callLogsRelations = relations(callLogs, ({one, many}) => ({
	astrologer: one(astrologers, {
		fields: [callLogs.astrologerId],
		references: [astrologers.id]
	}),
	user: one(users, {
		fields: [callLogs.userId],
		references: [users.id]
	}),
	reviews: many(reviews),
	chatMessages: many(chatMessages),
	commissionLogs: many(commissionLogs),
}));

export const usersRelations = relations(users, ({many}) => ({
	callLogs: many(callLogs),
	donations: many(donations),
	transactions: many(transactions),
	giftTransactions: many(giftTransactions),
	kundliRecords: many(kundliRecords),
	matchmakingRecords: many(matchmakingRecords),
	notifications: many(notifications),
	orders: many(orders),
	poojaBookings: many(poojaBookings),
	reports: many(reports),
	reviews: many(reviews),
	supportTickets: many(supportTickets),
	wallets: many(wallets),
	paymentOrders: many(paymentOrders),
	feedbacks: many(feedback),
}));

export const donationsRelations = relations(donations, ({one}) => ({
	user: one(users, {
		fields: [donations.userId],
		references: [users.id]
	}),
	transaction: one(transactions, {
		fields: [donations.transactionId],
		references: [transactions.id]
	}),
}));

export const transactionsRelations = relations(transactions, ({one, many}) => ({
	donations: many(donations),
	wallet: one(wallets, {
		fields: [transactions.walletId],
		references: [wallets.id]
	}),
	user: one(users, {
		fields: [transactions.userId],
		references: [users.id]
	}),
	astrologer: one(astrologers, {
		fields: [transactions.astrologerId],
		references: [astrologers.id]
	}),
	giftTransactions: many(giftTransactions),
	orders: many(orders),
	poojaBookings: many(poojaBookings),
	paymentOrders: many(paymentOrders),
	commissionLogs: many(commissionLogs),
}));

export const walletsRelations = relations(wallets, ({one, many}) => ({
	transactions: many(transactions),
	user: one(users, {
		fields: [wallets.userId],
		references: [users.id]
	}),
	astrologer: one(astrologers, {
		fields: [wallets.astrologerId],
		references: [astrologers.id]
	}),
}));

export const liveSessionsRelations = relations(liveSessions, ({one}) => ({
	astrologer: one(astrologers, {
		fields: [liveSessions.astrologerId],
		references: [astrologers.id]
	}),
}));

export const websiteContentRelations = relations(websiteContent, ({one}) => ({
	admin: one(admins, {
		fields: [websiteContent.updatedBy],
		references: [admins.id]
	}),
}));

export const withdrawalRequestsRelations = relations(withdrawalRequests, ({one}) => ({
	astrologer: one(astrologers, {
		fields: [withdrawalRequests.astrologerId],
		references: [astrologers.id]
	}),
	admin: one(admins, {
		fields: [withdrawalRequests.processedBy],
		references: [admins.id]
	}),
}));

export const giftTransactionsRelations = relations(giftTransactions, ({one}) => ({
	gift: one(gifts, {
		fields: [giftTransactions.giftId],
		references: [gifts.id]
	}),
	user: one(users, {
		fields: [giftTransactions.senderId],
		references: [users.id]
	}),
	astrologer: one(astrologers, {
		fields: [giftTransactions.receiverId],
		references: [astrologers.id]
	}),
	transaction: one(transactions, {
		fields: [giftTransactions.transactionId],
		references: [transactions.id]
	}),
}));

export const giftsRelations = relations(gifts, ({many}) => ({
	giftTransactions: many(giftTransactions),
}));

export const conversationMessagesRelations = relations(conversationMessages, ({one}) => ({
	conversation: one(conversations, {
		fields: [conversationMessages.conversationId],
		references: [conversations.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({many}) => ({
	conversationMessages: many(conversationMessages),
}));

export const kundliRecordsRelations = relations(kundliRecords, ({one}) => ({
	user: one(users, {
		fields: [kundliRecords.userId],
		references: [users.id]
	}),
}));

export const matchmakingRecordsRelations = relations(matchmakingRecords, ({one}) => ({
	user: one(users, {
		fields: [matchmakingRecords.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
	astrologer: one(astrologers, {
		fields: [notifications.astrologerId],
		references: [astrologers.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	transaction: one(transactions, {
		fields: [orders.transactionId],
		references: [transactions.id]
	}),
	orderItems: many(orderItems),
}));

export const poojaBookingsRelations = relations(poojaBookings, ({one}) => ({
	user: one(users, {
		fields: [poojaBookings.userId],
		references: [users.id]
	}),
	mandirPooja: one(mandirPooja, {
		fields: [poojaBookings.poojaId],
		references: [mandirPooja.id]
	}),
	transaction: one(transactions, {
		fields: [poojaBookings.transactionId],
		references: [transactions.id]
	}),
}));

export const mandirPoojaRelations = relations(mandirPooja, ({many}) => ({
	poojaBookings: many(poojaBookings),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	user: one(users, {
		fields: [reports.reportedUserId],
		references: [users.id]
	}),
	astrologer: one(astrologers, {
		fields: [reports.reportedAstrologerId],
		references: [astrologers.id]
	}),
	admin: one(admins, {
		fields: [reports.resolvedBy],
		references: [admins.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
	astrologer: one(astrologers, {
		fields: [reviews.astrologerId],
		references: [astrologers.id]
	}),
	callLog: one(callLogs, {
		fields: [reviews.callId],
		references: [callLogs.id]
	}),
}));

export const supportTicketsRelations = relations(supportTickets, ({one, many}) => ({
	user: one(users, {
		fields: [supportTickets.userId],
		references: [users.id]
	}),
	astrologer: one(astrologers, {
		fields: [supportTickets.astrologerId],
		references: [astrologers.id]
	}),
	admin: one(admins, {
		fields: [supportTickets.assignedTo],
		references: [admins.id]
	}),
	ticketReplies: many(ticketReplies),
}));

export const paymentOrdersRelations = relations(paymentOrders, ({one, many}) => ({
	user: one(users, {
		fields: [paymentOrders.userId],
		references: [users.id]
	}),
	transaction: one(transactions, {
		fields: [paymentOrders.transactionId],
		references: [transactions.id]
	}),
	paymentEvents: many(paymentEvents),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	callLog: one(callLogs, {
		fields: [chatMessages.callId],
		references: [callLogs.id]
	}),
}));

export const commissionLogsRelations = relations(commissionLogs, ({one}) => ({
	astrologer: one(astrologers, {
		fields: [commissionLogs.astrologerId],
		references: [astrologers.id]
	}),
	transaction: one(transactions, {
		fields: [commissionLogs.transactionId],
		references: [transactions.id]
	}),
	callLog: one(callLogs, {
		fields: [commissionLogs.callId],
		references: [callLogs.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	shopProduct: one(shopProducts, {
		fields: [orderItems.productId],
		references: [shopProducts.id]
	}),
}));

export const shopProductsRelations = relations(shopProducts, ({many}) => ({
	orderItems: many(orderItems),
}));

export const ticketRepliesRelations = relations(ticketReplies, ({one}) => ({
	supportTicket: one(supportTickets, {
		fields: [ticketReplies.ticketId],
		references: [supportTickets.id]
	}),
}));

export const paymentEventsRelations = relations(paymentEvents, ({one}) => ({
	paymentOrder: one(paymentOrders, {
		fields: [paymentEvents.paymentOrderId],
		references: [paymentOrders.id]
	}),
}));

export const muhuratRelations = relations(muhurat, ({one}) => ({
	muhuratCategory: one(muhuratCategories, {
		fields: [muhurat.categoryId],
		references: [muhuratCategories.id]
	}),
}));

export const muhuratCategoriesRelations = relations(muhuratCategories, ({many}) => ({
	muhurats: many(muhurat),
}));

export const feedbackRelations = relations(feedback, ({one}) => ({
	astrologer: one(astrologers, {
		fields: [feedback.astrologerId],
		references: [astrologers.id]
	}),
	user: one(users, {
		fields: [feedback.userId],
		references: [users.id]
	}),
}));