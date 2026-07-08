import { pgTable, uuid, varchar, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { userRole } from '../enums';

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  participantOneId: uuid('participant_one_id').notNull(),
  participantOneRole: userRole('participant_one_role').notNull(),
  participantTwoId: uuid('participant_two_id').notNull(),
  participantTwoRole: userRole('participant_two_role').notNull(),
  lastMessageAt: timestamp('last_message_at'),
  lastMessagePreview: varchar('last_message_preview', { length: 200 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueParticipants: uniqueIndex('unique_participants').on(table.participantOneId, table.participantTwoId),
  p1LastMsgIdx: index('idx_conversations_p1_lastmsg').on(table.participantOneId, table.lastMessageAt.desc()),
  p2LastMsgIdx: index('idx_conversations_p2_lastmsg').on(table.participantTwoId, table.lastMessageAt.desc()),
}));
