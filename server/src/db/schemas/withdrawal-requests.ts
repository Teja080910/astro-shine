import { pgTable, uuid, decimal, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { astrologers } from './astrologers';
import { admins } from './admins';
import { withdrawalStatus } from '../enums';

export const withdrawalRequests = pgTable('withdrawal_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  astrologerId: uuid('astrologer_id').references(() => astrologers.userId, { onDelete: 'cascade' }),
  adminId: uuid('admin_id').references(() => admins.userId, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: withdrawalStatus('status').notNull().default('pending'),
  bankAccount: jsonb('bank_account'),
  adminNote: text('admin_note'),
  processedBy: uuid('processed_by').references(() => admins.userId, { onDelete: 'set null' }),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
