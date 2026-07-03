import { pgTable, uuid, decimal, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { transactions } from './transactions';

export const donations = pgTable('donations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  message: text('message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
