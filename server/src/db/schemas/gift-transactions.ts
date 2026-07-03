import { pgTable, uuid, boolean, timestamp } from 'drizzle-orm/pg-core';
import { gifts } from './gifts';
import { users } from './users';
import { astrologers } from './astrologers';
import { transactions } from './transactions';

export const giftTransactions = pgTable('gift_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  giftId: uuid('gift_id').notNull().references(() => gifts.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: uuid('receiver_id').notNull().references(() => astrologers.id, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  isRedeemed: boolean('is_redeemed').notNull().default(false),
  redeemedAt: timestamp('redeemed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
