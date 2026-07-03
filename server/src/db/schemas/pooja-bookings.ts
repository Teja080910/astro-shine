import { pgTable, uuid, date, decimal, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { mandirPooja } from './mandir-pooja';
import { transactions } from './transactions';

export const poojaBookings = pgTable('pooja_bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  poojaId: uuid('pooja_id').notNull().references(() => mandirPooja.id, { onDelete: 'cascade' }),
  bookingDate: date('booking_date').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
