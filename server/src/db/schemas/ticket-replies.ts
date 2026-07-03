import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { userRole } from '../enums';
import { supportTickets } from './support-tickets';

export const ticketReplies = pgTable('ticket_replies', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull(),
  senderRole: userRole('sender_role').notNull(),
  message: text('message').notNull(),
  attachments: text('attachments').array(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
