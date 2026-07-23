import { pgTable, uuid, text, integer, decimal, boolean, timestamp } from 'drizzle-orm/pg-core';
import { verificationStatus, onlineStatus } from '../enums';
import { users } from './users';

export const astrologers = pgTable('astrologers', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  experience: integer('experience').notNull().default(0),
  specialization: text('specialization').array().notNull().default([]),
  languages: text('languages').array().notNull().default([]),
  skills: text('skills').array().notNull().default([]),
  pricePerMin: decimal('price_per_min', { precision: 10, scale: 2 }).notNull().default('0'),
  rating: decimal('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  totalReviews: integer('total_reviews').notNull().default(0),
  chatPricePerMin: decimal('chat_price_per_min', { precision: 10, scale: 2 }).notNull().default('0'),
  audioCallPricePerMin: decimal('audio_call_price_per_min', { precision: 10, scale: 2 }).notNull().default('0'),
  videoCallPricePerMin: decimal('video_call_price_per_min', { precision: 10, scale: 2 }).notNull().default('0'),
  totalChats: integer('total_chats').notNull().default(0),
  totalAudioCalls: integer('total_audio_calls').notNull().default(0),
  totalVideoCalls: integer('total_video_calls').notNull().default(0),
  totalCalls: integer('total_calls').notNull().default(0),
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2 }).notNull().default('0'),
  verificationStatus: verificationStatus('verification_status').notNull().default('pending'),
  verificationDoc: text('verification_doc').array(),
  verificationNote: text('verification_note'),
  onlineStatus: onlineStatus('online_status').notNull().default('offline'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
