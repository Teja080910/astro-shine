import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: varchar('provider', { length: 100 }).notNull(),
  keyName: varchar('key_name', { length: 100 }).notNull(),
  apiKey: text('api_key').notNull(),
  apiSecret: text('api_secret'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
