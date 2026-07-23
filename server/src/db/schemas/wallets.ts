import { pgTable, uuid, decimal, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { astrologers } from './astrologers';
import { admins } from './admins';

export const wallets = pgTable('wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  astrologerId: uuid('astrologer_id').references(() => astrologers.userId, { onDelete: 'cascade' }),
  adminId: uuid('admin_id').references(() => admins.userId, { onDelete: 'cascade' }),
  balance: decimal('balance', { precision: 12, scale: 2 }).notNull().default('0'),
  totalAdded: decimal('total_added', { precision: 12, scale: 2 }).notNull().default('0'),
  totalDeducted: decimal('total_deducted', { precision: 12, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 10 }).notNull().default('INR'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
