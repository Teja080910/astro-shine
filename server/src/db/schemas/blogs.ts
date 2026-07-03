import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { blogStatus, userRole } from '../enums';

export const blogs = pgTable('blogs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  coverImage: text('cover_image'),
  authorId: uuid('author_id'),
  authorRole: userRole('author_role'),
  status: blogStatus('status').notNull().default('draft'),
  tags: text('tags').array().notNull().default([]),
  viewCount: integer('view_count').notNull().default(0),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
