import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const shopProducts = pgTable('shop_products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  comparePrice: decimal('compare_price', { precision: 10, scale: 2 }),
  images: text('images').array().notNull().default([]),
  category: varchar('category', { length: 100 }),
  stock: integer('stock').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
