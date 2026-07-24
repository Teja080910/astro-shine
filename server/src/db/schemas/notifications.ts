import { pgTable, uuid, varchar, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';
import { notificationType } from '../enums';
import { users } from './users';
import { astrologers } from './astrologers';

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  astrologerId: uuid('astrologer_id').references(() => astrologers.userId, { onDelete: 'cascade' }),
  type: notificationType('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  data: jsonb('data'),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at'),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
