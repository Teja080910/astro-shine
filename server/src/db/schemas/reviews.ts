import { pgTable, uuid, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { astrologers } from './astrologers';
import { callLogs } from './call-logs';

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  astrologerId: uuid('astrologer_id').notNull().references(() => astrologers.userId, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  callId: uuid('call_id').references(() => callLogs.id, { onDelete: 'set null' }),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
