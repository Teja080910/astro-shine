import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { astrologers } from './astrologers';

export const liveSessions = pgTable('live_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  astrologerId: uuid('astrologer_id').notNull().references(() => astrologers.userId, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  thumbnail: text('thumbnail'),
  status: varchar('status', { length: 50 }).notNull().default('scheduled'),
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  viewerCount: integer('viewer_count').notNull().default(0),
  maxViewers: integer('max_viewers'),
  agoraChannel: varchar('agora_channel', { length: 255 }),
  agoraToken: text('agora_token'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
