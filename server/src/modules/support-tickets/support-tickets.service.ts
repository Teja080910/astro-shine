import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupportTicketsService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(status?: string) {
    const where = status ? eq(schema.supportTickets.status, status) : undefined;
    return this.db.query.supportTickets.findMany({ where, orderBy: (t: any) => t.createdAt });
  }

  async findById(id: string) { return this.db.query.supportTickets.findFirst({ where: eq(schema.supportTickets.id, id) }); }
  async findByUserId(userId: string) { return this.db.query.supportTickets.findMany({ where: eq(schema.supportTickets.userId, userId), orderBy: (t: any) => t.createdAt }); }

  async create(data: typeof schema.supportTickets.$inferInsert) {
    const [r] = await this.db.insert(schema.supportTickets).values(data).returning();
    if (r.userId) this.realtime.emitToUser(r.userId, 'support:ticket-updated', r);
    this.realtime.emitToRole('admin', 'support:ticket-updated', r);
    return r;
  }

  async assign(ticketId: string, adminId: string) {
    const [r] = await this.db.update(schema.supportTickets).set({ assignedTo: adminId, status: 'in_progress', updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticketId)).returning();
    if (r.userId) {
      this.realtime.emitToUser(r.userId, 'support:ticket-updated', r);
      this.notifications.create({ userId: r.userId, type: 'system', title: 'Ticket Assigned', body: `Your ticket "${r.subject}" has been assigned to an admin.` });
    }
    this.realtime.emitToRole('admin', 'support:ticket-updated', r);
    return r;
  }

  async updateStatus(ticketId: string, status: string) {
    const updateData: any = { status, updatedAt: new Date() };
    if (status === 'resolved' || status === 'closed') updateData.resolvedAt = new Date();
    const [r] = await this.db.update(schema.supportTickets).set(updateData).where(eq(schema.supportTickets.id, ticketId)).returning();
    if (r.userId) {
      this.realtime.emitToUser(r.userId, 'support:ticket-updated', r);
      this.notifications.create({ userId: r.userId, type: 'system', title: 'Ticket Updated', body: `Your ticket "${r.subject}" status changed to ${status}.` });
    }
    this.realtime.emitToRole('admin', 'support:ticket-updated', r);
    return r;
  }

  async updatePriority(ticketId: string, priority: string) {
    const [r] = await this.db.update(schema.supportTickets).set({ priority, updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticketId)).returning();
    if (r.userId) {
      this.realtime.emitToUser(r.userId, 'support:ticket-updated', r);
      this.notifications.create({ userId: r.userId, type: 'system', title: 'Priority Changed', body: `Your ticket "${r.subject}" priority changed to ${priority}.` });
    }
    this.realtime.emitToRole('admin', 'support:ticket-updated', r);
    return r;
  }

  async resolve(ticketId: string) {
    const [r] = await this.db.update(schema.supportTickets).set({ status: 'resolved', resolvedAt: new Date(), updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticketId)).returning();
    if (r.userId) {
      this.realtime.emitToUser(r.userId, 'support:ticket-updated', r);
      this.notifications.create({ userId: r.userId, type: 'system', title: 'Ticket Resolved', body: `Your ticket "${r.subject}" has been resolved.` });
    }
    this.realtime.emitToRole('admin', 'support:ticket-updated', r);
    return r;
  }

  async getReplies(ticketId: string) { return this.db.query.ticketReplies.findMany({ where: eq(schema.ticketReplies.ticketId, ticketId), orderBy: (r: any) => r.createdAt }); }

  async addReply(data: typeof schema.ticketReplies.$inferInsert) {
    const [r] = await this.db.insert(schema.ticketReplies).values(data).returning();
    const ticket = await this.findById(r.ticketId);
    if (ticket?.userId) {
      this.realtime.emitToUser(ticket.userId, 'support:reply-added', r);
      this.notifications.create({ userId: ticket.userId, type: 'system', title: 'New Reply', body: `Admin replied to your ticket "${ticket.subject}".` });
    }
    this.realtime.emitToRole('admin', 'support:reply-added', r);
    return r;
  }
}
