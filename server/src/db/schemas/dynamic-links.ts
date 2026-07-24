import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { admins } from './admins';

export const dynamicLinks = pgTable('dynamic_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageName: varchar('page_name', { length: 100 }).unique().notNull(),
  url: text('url').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  updatedBy: uuid('updated_by').references(() => admins.userId, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
