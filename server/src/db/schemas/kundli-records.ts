import { pgTable, uuid, varchar, date, time, decimal, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { gender } from '../enums';
import { users } from './users';

export const kundliRecords = pgTable('kundli_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  gender: gender('gender').notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  timeOfBirth: time('time_of_birth').notNull(),
  placeOfBirth: varchar('place_of_birth', { length: 255 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  timezone: varchar('timezone', { length: 50 }),
  chartData: jsonb('chart_data'),
  planetaryPositions: jsonb('planetary_positions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
