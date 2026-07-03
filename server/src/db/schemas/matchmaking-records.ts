import { pgTable, uuid, varchar, date, time, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const matchmakingRecords = pgTable('matchmaking_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  person1Name: varchar('person1_name', { length: 255 }).notNull(),
  person1Dob: date('person1_dob').notNull(),
  person1Tob: time('person1_tob').notNull(),
  person1Place: varchar('person1_place', { length: 255 }).notNull(),
  person2Name: varchar('person2_name', { length: 255 }).notNull(),
  person2Dob: date('person2_dob').notNull(),
  person2Tob: time('person2_tob').notNull(),
  person2Place: varchar('person2_place', { length: 255 }).notNull(),
  matchScore: integer('match_score'),
  matchDetails: jsonb('match_details'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
