import { pgTable, uuid, varchar, date, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const horoscopeRecords = pgTable('horoscope_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  zodiacSign: varchar('zodiac_sign', { length: 20 }).notNull(),
  date: date('date').notNull(),
  prediction: text('prediction').notNull(),
  lovePrediction: text('love_prediction'),
  careerPrediction: text('career_prediction'),
  financePrediction: text('finance_prediction'),
  healthPrediction: text('health_prediction'),
  luckyNumber: integer('lucky_number'),
  luckyColor: varchar('lucky_color', { length: 50 }),
  mood: varchar('mood', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
