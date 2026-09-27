import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { paginated, Pagination } from '../../common/utils/pagination';

@Injectable()
export class SupportTicketsService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(status?: string, pagination?: Pagination) {
    const conditions: any[] = [];
    if (status) conditions.push(eq(schema.supportTickets.status, status));
    if (pagination?.q) {
      const pattern = `%${pagination.q}%`;
      conditions.push(or(
        ilike(schema.supportTickets.subject, pattern),
        ilike(schema.supportTickets.status, pattern),
        ilike(schema.supportTickets.priority, pattern),
      ));
    }
    const where = conditions.length ? and(...conditions) : undefined;

    if (!pagination?.enabled) {
      return this.db.query.supportTickets.findMany({ where, orderBy: (t: any) => t.createdAt });
    }

    const [data, countRows] = await Promise.all([
      this.db.select().from(schema.supportTickets).where(where)
        .orderBy(desc(schema.supportTickets.createdAt))
        .limit(pagination.limit).offset(pagination.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.supportTickets).where(where),
    ]);
    return paginated(data, countRows[0]?.count ?? 0, pagination);
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
      this.notifications.create({ userId: r.userId, type: 'system', title: 'Ticket Assigned', body: `Your ticket "${r.subject}" has been assigned to an admin.`, data: { screen: 'TicketDetail', ticketId: r.id } });
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
      this.notifications.create({ userId: r.userId, type: 'system', title: 'Ticket Updated', body: `Your ticket "${r.subject}" status changed to ${status}.`, data: { screen: 'TicketDetail', ticketId: r.id } });
    }
    this.realtime.emitToRole('admin', 'support:ticket-updated', r);
    return r;
  }

  async updatePriority(ticketId: string, priority: string) {
    const [r] = await this.db.update(schema.supportTickets).set({ priority, updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticketId)).returning();
    if (r.userId) {
      this.realtime.emitToUser(r.userId, 'support:ticket-updated', r);
      this.notifications.create({ userId: r.userId, type: 'system', title: 'Priority Changed', body: `Your ticket "${r.subject}" priority changed to ${priority}.`, data: { screen: 'TicketDetail', ticketId: r.id } });
    }
    this.realtime.emitToRole('admin', 'support:ticket-updated', r);
    return r;
  }

  async resolve(ticketId: string) {
    const [r] = await this.db.update(schema.supportTickets).set({ status: 'resolved', resolvedAt: new Date(), updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticketId)).returning();
    if (r.userId) {
      this.realtime.emitToUser(r.userId, 'support:ticket-updated', r);
      this.notifications.create({ userId: r.userId, type: 'system', title: 'Ticket Resolved', body: `Your ticket "${r.subject}" has been resolved.`, data: { screen: 'TicketDetail', ticketId: r.id } });
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
      this.notifications.create({ userId: ticket.userId, type: 'system', title: 'New Reply', body: `Admin replied to your ticket "${ticket.subject}".`, data: { screen: 'TicketDetail', ticketId: ticket.id } });
    }
    this.realtime.emitToRole('admin', 'support:reply-added', r);
    return r;
  }
}
