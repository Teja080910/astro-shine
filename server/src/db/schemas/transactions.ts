import { pgTable, uuid, decimal, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { wallets } from './wallets';
import { users } from './users';
import { astrologers } from './astrologers';
import { transactionType, transactionCategory, transactionStatus } from '../enums';

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  astrologerId: uuid('astrologer_id').references(() => astrologers.userId, { onDelete: 'set null' }),
  type: transactionType('type').notNull(),
  category: transactionCategory('category').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 12, scale: 2 }).notNull().default('0'),
  netAmount: decimal('net_amount', { precision: 12, scale: 2 }).notNull(),
  status: transactionStatus('status').notNull().default('pending'),
  referenceId: varchar('reference_id', { length: 255 }),
  gatewayResponse: jsonb('gateway_response'),
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
