import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class SupportTicketsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.supportTickets.findMany(); }
  async findById(id: string) { return this.db.query.supportTickets.findFirst({ where: eq(schema.supportTickets.id, id) }); }
  async findByUserId(userId: string) { return this.db.query.supportTickets.findMany({ where: eq(schema.supportTickets.userId, userId) }); }

  async create(data: typeof schema.supportTickets.$inferInsert) { const [r] = await this.db.insert(schema.supportTickets).values(data).returning(); return r; }

  async assign(ticketId: string, adminId: string) {
    const [r] = await this.db.update(schema.supportTickets).set({ assignedTo: adminId, status: 'in_progress', updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticketId)).returning(); return r;
  }

  async resolve(ticketId: string) {
    const [r] = await this.db.update(schema.supportTickets).set({ status: 'resolved', resolvedAt: new Date(), updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticketId)).returning(); return r;
  }

  async getReplies(ticketId: string) { return this.db.query.ticketReplies.findMany({ where: eq(schema.ticketReplies.ticketId, ticketId) }); }

  async addReply(data: typeof schema.ticketReplies.$inferInsert) { const [r] = await this.db.insert(schema.ticketReplies).values(data).returning(); return r; }
}
