import { pgTable, uuid, varchar, jsonb, text, timestamp } from 'drizzle-orm/pg-core';
import { paymentOrders } from './payment-orders';

export const paymentEvents = pgTable('payment_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentOrderId: uuid('payment_order_id').references(() => paymentOrders.id, { onDelete: 'set null' }),
  eventId: varchar('event_id', { length: 100 }).unique(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  razorpayEventId: varchar('razorpay_event_id', { length: 100 }),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('received'),
  errorMessage: text('error_message'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
