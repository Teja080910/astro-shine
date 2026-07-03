import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class ChatService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findByCallId(callId: string) { return this.db.query.chatMessages.findMany({ where: eq(schema.chatMessages.callId, callId) }); }
  async findById(id: string) { return this.db.query.chatMessages.findFirst({ where: eq(schema.chatMessages.id, id) }); }

  async create(data: typeof schema.chatMessages.$inferInsert) {
    const [r] = await this.db.insert(schema.chatMessages).values(data).returning(); return r;
  }

  async markAsRead(id: string) {
    const [r] = await this.db.update(schema.chatMessages).set({ isRead: true, readAt: new Date() }).where(eq(schema.chatMessages.id, id)).returning(); return r;
  }
}
