import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { paginated, Pagination } from '../../common/utils/pagination';

@Injectable()
export class SupportTicketsService {
  private readonly logger = new Logger(SupportTicketsService.name);

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

  /**
   * Subject helpers. The mobile app prefixes the subject with the chosen category, e.g.
   * "[Billing] Refund not received". Notifications should talk about the
   * subject the user typed, without leaking the bracket prefix.
   */
  private ticketLabel(ticket: any): string {
    const raw = String(ticket?.subject || '').trim();
    const stripped = raw.replace(/^\s*\[[^\]]*\]\s*/, '').trim();
    return stripped || 'your ticket';
  }

  private ticketCategory(ticket: any): string | undefined {
    const match = /^\s*\[([^\]]*)\]/.exec(String(ticket?.subject || ''));
    const value = match?.[1]?.trim();
    return value || undefined;
  }

  private ticketReference(ticket: any): string {
    return String(ticket?.id || '').slice(0, 8).toUpperCase();
  }

  /**
   * Support tickets store the creator in `userId` even when an astrologer
   * files them. Notifications however have to go to the astrologer inbox
   * (`astrologerId`) so they show up in the astrologer app.
   */
  private async ownerTarget(ticket: any): Promise<{ userId?: string; astrologerId?: string }> {
    if (ticket?.astrologerId) return { astrologerId: ticket.astrologerId };
    if (!ticket?.userId) return {};
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, ticket.userId),
      columns: { role: true },
    });
    return user?.role === 'astrologer'
      ? { astrologerId: ticket.userId }
      : { userId: ticket.userId };
  }

  private async notifyOwner(
    ticket: any,
    payload: { title: string; body: string; data?: Record<string, any> },
  ) {
    const target = await this.ownerTarget(ticket);
    if (!target.userId && !target.astrologerId) return;
    await this.notifications.create({
      ...target,
      type: 'system',
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });
  }

  async create(data: typeof schema.supportTickets.$inferInsert) {
    const [r] = await this.db.insert(schema.supportTickets).values(data).returning();
    const owner = await this.ownerTarget(r);
    const ownerId = owner.userId || owner.astrologerId;
    if (ownerId) {
      this.realtime.emitToUser(ownerId, 'support:ticket-updated', r);
      const category = this.ticketCategory(r);
      this.notifyOwner(r, {
        title: 'Support ticket received',
        body:
          `We have received your support ticket "${this.ticketLabel(r)}"` +
          `${category ? ` (${category})` : ''}. ` +
          `Our team will reply shortly. Reference #${this.ticketReference(r)}.`,
        data: {
          screen: 'TicketDetail',
          ticketId: r.id,
          status: r.status,
          ...(category ? { category } : {}),
        },
      }).catch((e) =>
        this.logger.warn(`Ticket received notification failed: ${e.message}`),
      );
    }
    this.realtime.emitToRole('admin', 'support:ticket-updated', r);
    try {
      await this.notifications.notifyAdmins({
        type: 'system',
        title: 'New support ticket',
        body:
          `${this.ticketCategory(r) ? `[${this.ticketCategory(r)}] ` : ''}` +
          `"${this.ticketLabel(r)}" — ${r.priority} priority. Reference #${this.ticketReference(r)}.`,
        data: {
          screen: 'AdminTicketDetail',
          ticketId: r.id,
          status: r.status,
          priority: r.priority,
        },
      });
    } catch (e: any) {
      this.logger.warn(`Ticket admin notification failed: ${e.message}`);
    }
    return r;
  }

  async assign(ticketId: string, adminId: string) {
    const [r] = await this.db.update(schema.supportTickets).set({ assignedTo: adminId, status: 'in_progress', updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticketId)).returning();
    const owner = await this.ownerTarget(r);
    const ownerId = owner.userId || owner.astrologerId;
    if (ownerId) {
      this.realtime.emitToUser(ownerId, 'support:ticket-updated', r);
      this.notifyOwner(r, { title: 'Support ticket assigned', body: `Your ticket "${this.ticketLabel(r)}" has been assigned to our support team.`, data: { screen: 'TicketDetail', ticketId: r.id, status: r.status } }).catch((e) => this.logger.warn(`Ticket assigned notification failed: ${e.message}`));
    }
    if (adminId) {
      this.notifications.create({ userId: adminId, type: 'system', title: 'Support ticket assigned to you', body: `Ticket "${this.ticketLabel(r)}" has been assigned to you.`, data: { screen: 'AdminTicketDetail', ticketId: r.id, status: r.status } }).catch((e) => this.logger.warn(`Ticket assignee notification failed: ${e.message}`));
    }
    this.realtime.emitToRole('admin', 'support:ticket-updated', r);
    return r;
  }

  async updateStatus(ticketId: string, status: string) {
    const updateData: any = { status, updatedAt: new Date() };
    if (status === 'resolved' || status === 'closed') updateData.resolvedAt = new Date();
    const [r] = await this.db.update(schema.supportTickets).set(updateData).where(eq(schema.supportTickets.id, ticketId)).returning();
    const owner = await this.ownerTarget(r);
    const ownerId = owner.userId || owner.astrologerId;
    if (ownerId) {
      this.realtime.emitToUser(ownerId, 'support:ticket-updated', r);
      this.notifyOwner(r, { title: 'Support ticket updated', body: `Your ticket "${this.ticketLabel(r)}" is now marked as ${String(status).replace(/_/g, ' ')}.`, data: { screen: 'TicketDetail', ticketId: r.id, status } }).catch((e) => this.logger.warn(`Ticket status notification failed: ${e.message}`));
    }
    this.realtime.emitToRole('admin', 'support:ticket-updated', r);
    return r;
  }

  async updatePriority(ticketId: string, priority: string) {
    const [r] = await this.db.update(schema.supportTickets).set({ priority, updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticketId)).returning();
    const owner = await this.ownerTarget(r);
    const ownerId = owner.userId || owner.astrologerId;
    if (ownerId) {
      this.realtime.emitToUser(ownerId, 'support:ticket-updated', r);
      this.notifyOwner(r, { title: 'Support ticket priority updated', body: `Your ticket "${this.ticketLabel(r)}" priority is now ${priority}.`, data: { screen: 'TicketDetail', ticketId: r.id, status: r.status, priority } }).catch((e) => this.logger.warn(`Ticket priority notification failed: ${e.message}`));
    }
    this.realtime.emitToRole('admin', 'support:ticket-updated', r);
    return r;
  }

  async resolve(ticketId: string) {
    const [r] = await this.db.update(schema.supportTickets).set({ status: 'resolved', resolvedAt: new Date(), updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticketId)).returning();
    const owner = await this.ownerTarget(r);
    const ownerId = owner.userId || owner.astrologerId;
    if (ownerId) {
      this.realtime.emitToUser(ownerId, 'support:ticket-updated', r);
      this.notifyOwner(r, { title: 'Support ticket resolved', body: `Your ticket "${this.ticketLabel(r)}" has been resolved. If the issue continues, reply on the ticket and we will reopen it.`, data: { screen: 'TicketDetail', ticketId: r.id, status: 'resolved' } }).catch((e) => this.logger.warn(`Ticket resolved notification failed: ${e.message}`));
    }
    this.realtime.emitToRole('admin', 'support:ticket-updated', r);
    return r;
  }

  async getReplies(ticketId: string) { return this.db.query.ticketReplies.findMany({ where: eq(schema.ticketReplies.ticketId, ticketId), orderBy: (r: any) => r.createdAt }); }

  async addReply(data: typeof schema.ticketReplies.$inferInsert) {
    const [r] = await this.db.insert(schema.ticketReplies).values(data).returning();
    const ticket = await this.findById(r.ticketId);
    const fromAdmin = (data as any).senderRole === 'admin';
    if (ticket) {
      const owner = await this.ownerTarget(ticket);
      const ownerId = owner.userId || owner.astrologerId;
      if (ownerId) this.realtime.emitToUser(ownerId, 'support:reply-added', r);
      if (fromAdmin) {
        this.notifyOwner(ticket, { title: 'New reply on your support ticket', body: `Our support team replied to "${this.ticketLabel(ticket)}". Tap to read the reply.`, data: { screen: 'TicketDetail', ticketId: ticket.id, status: ticket.status } }).catch((e) => this.logger.warn(`Ticket reply notification failed: ${e.message}`));
      }
    }
    if (!fromAdmin) {
      this.notifications.notifyAdmins({
        type: 'system',
        title: 'New reply on support ticket',
        body: `A new reply was added to "${this.ticketLabel(ticket)}".`,
        data: { screen: 'AdminTicketDetail', ticketId: ticket?.id, status: ticket?.status },
      }).catch((e) => this.logger.warn(`Ticket reply admin notification failed: ${e.message}`));
    }
    this.realtime.emitToRole('admin', 'support:reply-added', r);
    return r;
  }
}
