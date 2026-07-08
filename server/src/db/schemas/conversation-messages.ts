import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { messageType, userRole } from '../enums';
import { conversations } from './conversations';

export const conversationMessages = pgTable('conversation_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull(),
  senderRole: userRole('sender_role').notNull(),
  type: messageType('type').notNull().default('text'),
  content: text('content'),
  mediaUrl: text('media_url'),
  isDelivered: boolean('is_delivered').notNull().default(false),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  convCreatedIdx: index('idx_conv_messages_conv_created').on(table.conversationId, table.createdAt.desc()),
  unreadIdx: index('idx_conv_messages_unread').on(table.conversationId, table.isRead).where(sql`${table.isRead} = false`),
}));
