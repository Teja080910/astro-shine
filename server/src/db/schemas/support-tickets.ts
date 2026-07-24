import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { astrologers } from './astrologers';
import { admins } from './admins';

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  astrologerId: uuid('astrologer_id').references(() => astrologers.userId, { onDelete: 'set null' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('open'),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'),
  assignedTo: uuid('assigned_to').references(() => admins.userId, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
