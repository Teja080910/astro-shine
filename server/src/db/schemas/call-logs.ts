import { pgTable, uuid, integer, decimal, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { astrologers } from './astrologers';
import { users } from './users';
import { callType, callStatus } from '../enums';

export const callLogs = pgTable('call_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  astrologerId: uuid('astrologer_id').notNull().references(() => astrologers.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: callType('type').notNull(),
  status: callStatus('status').notNull().default('initiated'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  ratePerMin: decimal('rate_per_min', { precision: 10, scale: 2 }),
  agoraChannel: varchar('agora_channel', { length: 255 }),
  agoraToken: text('agora_token'),
  recordingUrl: text('recording_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
