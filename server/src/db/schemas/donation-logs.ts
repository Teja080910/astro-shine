import { pgTable, uuid, decimal, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { admins } from './admins';

export const donationLogs = pgTable('donation_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 20 }).notNull().default('received'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('completed'),
  note: text('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
