import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class NotificationsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findByUserId(userId: string) { return this.db.query.notifications.findMany({ where: eq(schema.notifications.userId, userId) }); }
  async findByAstrologerId(astrologerId: string) { return this.db.query.notifications.findMany({ where: eq(schema.notifications.astrologerId, astrologerId) }); }
  async findById(id: string) { return this.db.query.notifications.findFirst({ where: eq(schema.notifications.id, id) }); }

  async create(data: typeof schema.notifications.$inferInsert) { const [r] = await this.db.insert(schema.notifications).values(data).returning(); return r; }

  async markAsRead(id: string) {
    const [r] = await this.db.update(schema.notifications).set({ isRead: true, readAt: new Date() }).where(eq(schema.notifications.id, id)).returning(); return r;
  }

  async markAllAsRead(userId?: string, astrologerId?: string) {
    const where = userId ? eq(schema.notifications.userId, userId) : eq(schema.notifications.astrologerId, astrologerId!);
    await this.db.update(schema.notifications).set({ isRead: true, readAt: new Date() }).where(where);
  }
}
