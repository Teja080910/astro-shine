import { pgTable, uuid, varchar, text, date, time, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { muhuratCategories } from './muhurat-categories';

export const muhurat = pgTable('muhurat', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').notNull().references(() => muhuratCategories.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  date: date('date').notNull(),
  time: time('time').notNull(),
  description: text('description'),
  createdBy: uuid('created_by'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueDateTime: uniqueIndex('unique_date_time').on(table.date, table.time),
}));
