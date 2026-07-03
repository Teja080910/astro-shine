import { pgTable, uuid, varchar, text, date, boolean, timestamp } from 'drizzle-orm/pg-core';
import { authProvider, gender } from '../enums';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 20 }).unique(),
  password: varchar('password', { length: 255 }),
  avatar: text('avatar'),
  gender: gender('gender'),
  dateOfBirth: date('date_of_birth'),
  authProvider: authProvider('auth_provider').notNull().default('email'),
  authProviderId: varchar('auth_provider_id', { length: 255 }),
  fcmToken: text('fcm_token'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});
