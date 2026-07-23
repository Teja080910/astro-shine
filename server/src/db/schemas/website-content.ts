import { pgTable, uuid, varchar, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';
import { admins } from './admins';

export const websiteContent = pgTable('website_content', {
  id: uuid('id').defaultRandom().primaryKey(),
  section: varchar('section', { length: 100 }).unique().notNull(),
  content: jsonb('content').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  updatedBy: uuid('updated_by').references(() => admins.userId, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
