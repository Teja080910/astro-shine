import { pgTable, uuid, decimal, text, timestamp } from 'drizzle-orm/pg-core';
import { astrologers } from './astrologers';
import { users } from './users';

export const feedback = pgTable('feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  astrologerId: uuid('astrologer_id').notNull().references(() => astrologers.userId, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'set null' }),
  ratings: decimal('ratings', { precision: 2, scale: 1 }).notNull(),
  comments: text('comments'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
