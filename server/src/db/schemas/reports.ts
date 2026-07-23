import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { reportReason, userRole } from '../enums';
import { users } from './users';
import { astrologers } from './astrologers';
import { admins } from './admins';

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reporterRole: userRole('reporter_role').notNull(),
  reportedUserId: uuid('reported_user_id').references(() => users.id, { onDelete: 'set null' }),
  reportedAstrologerId: uuid('reported_astrologer_id').references(() => astrologers.userId, { onDelete: 'set null' }),
  reason: reportReason('reason').notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  resolvedBy: uuid('resolved_by').references(() => admins.userId, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
