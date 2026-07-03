import { pgTable, uuid, varchar, date, time, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const panchangRecords = pgTable('panchang_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: date('date').notNull().unique(),
  tithi: varchar('tithi', { length: 100 }),
  nakshatra: varchar('nakshatra', { length: 100 }),
  yoga: varchar('yoga', { length: 100 }),
  karana: varchar('karana', { length: 100 }),
  sunrise: time('sunrise'),
  sunset: time('sunset'),
  moonrise: time('moonrise'),
  moonset: time('moonset'),
  rahuKaal: jsonb('rahu_kaal'),
  data: jsonb('data'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
