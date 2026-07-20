import { pgTable, uuid, decimal, varchar, jsonb, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { transactions } from './transactions';

export const paymentOrders = pgTable('payment_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  razorpayOrderId: varchar('razorpay_order_id', { length: 100 }).unique(),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 100 }),
  razorpaySignature: varchar('razorpay_signature', { length: 255 }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('INR'),
  purpose: varchar('purpose', { length: 50 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('created'),
  failedReason: varchar('failed_reason', { length: 255 }),
  metadata: jsonb('metadata').notNull().default({}),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
