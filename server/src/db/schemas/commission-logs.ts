import { pgTable, uuid, decimal, timestamp } from 'drizzle-orm/pg-core';
import { astrologers } from './astrologers';
import { transactions } from './transactions';
import { callLogs } from './call-logs';

export const commissionLogs = pgTable('commission_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  astrologerId: uuid('astrologer_id').notNull().references(() => astrologers.userId, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  callId: uuid('call_id').references(() => callLogs.id, { onDelete: 'set null' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  // Total withheld from the astrologer (platform fee % + TDS %).
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  totalEarned: decimal('total_earned', { precision: 12, scale: 2 }).notNull(),
  platformFee: decimal('platform_fee', { precision: 12, scale: 2 }).notNull(),
  // Breakdown of `percentage` so platform revenue and TDS are separable.
  platformFeePercentage: decimal('platform_fee_percentage', { precision: 5, scale: 2 }).notNull().default('20'),
  tdsPercentage: decimal('tds_percentage', { precision: 5, scale: 2 }).notNull().default('10'),
  tdsAmount: decimal('tds_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
