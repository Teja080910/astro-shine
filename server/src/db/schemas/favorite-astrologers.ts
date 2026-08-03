import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';
import { astrologers } from './astrologers';

export const favoriteAstrologers = pgTable('favorite_astrologers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  astrologerId: uuid('astrologer_id').notNull().references(() => astrologers.userId, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('user_astrologer_unique_idx').on(table.userId, table.astrologerId),
]);
