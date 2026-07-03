import { pgTable, uuid, decimal, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { transactions } from './transactions';

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  shippingAddress: jsonb('shipping_address'),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
