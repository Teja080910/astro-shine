import { pgTable, uuid, varchar, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const appReleases = pgTable('app_releases', {
  id: uuid('id').defaultRandom().primaryKey(),
  appName: varchar('app_name', { length: 50 }).notNull(),
  platform: varchar('platform', { length: 20 }).notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  buildNumber: integer('build_number').notNull(),
  releaseNotes: text('release_notes'),
  downloadUrl: text('download_url'),
  isMandatory: boolean('is_mandatory').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  releasedAt: timestamp('released_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
