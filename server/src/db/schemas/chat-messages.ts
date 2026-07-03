import { pgTable, uuid, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { messageType, userRole } from '../enums';
import { callLogs } from './call-logs';

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  callId: uuid('call_id').notNull().references(() => callLogs.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull(),
  senderRole: userRole('sender_role').notNull(),
  type: messageType('type').notNull().default('text'),
  content: text('content'),
  mediaUrl: text('media_url'),
  duration: integer('duration'),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
