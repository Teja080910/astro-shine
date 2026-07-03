import { pgTable, uuid, decimal, boolean, timestamp } from 'drizzle-orm/pg-core';
import { astrologers } from './astrologers';
import { commissionType } from '../enums';

export const commissions = pgTable('commissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  astrologerId: uuid('astrologer_id').notNull().unique().references(() => astrologers.id, { onDelete: 'cascade' }),
  type: commissionType('type').notNull().default('percentage'),
  value: decimal('value', { precision: 5, scale: 2 }).notNull(),
  minAmount: decimal('min_amount', { precision: 10, scale: 2 }),
  maxCap: decimal('max_cap', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
