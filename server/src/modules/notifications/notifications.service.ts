import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc, sql } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
  ) {}

  async findByUserId(userId: string) { return this.db.query.notifications.findMany({ where: eq(schema.notifications.userId, userId), orderBy: desc(schema.notifications.createdAt) }); }
  async findByAstrologerId(astrologerId: string) { return this.db.query.notifications.findMany({ where: eq(schema.notifications.astrologerId, astrologerId), orderBy: desc(schema.notifications.createdAt) }); }
  async findAll() {
    const rows = await this.db.execute(sql`
      SELECT
        n.id, n.user_id as "userId", n.astrologer_id as "astrologerId",
        n.type, n.title, n.body, n.data, n.is_read as "isRead",
        n.read_at as "readAt", n.image, n.created_at as "createdAt",
        COALESCE(u.name, au.name) as "targetName"
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN astrologers a ON n.astrologer_id = a.user_id
      LEFT JOIN users au ON a.user_id = au.id
      ORDER BY n.created_at DESC
    `);
    return rows.rows;
  }
  async findById(id: string) { return this.db.query.notifications.findFirst({ where: eq(schema.notifications.id, id) }); }

  async create(data: any) {
    const { targetAudience, ...rest } = data;

    if (targetAudience === 'all_users') {
      return this.bulkCreateToUsers(rest);
    }
    if (targetAudience === 'all_astrologers') {
      return this.bulkCreateToAstrologers(rest);
    }
    if (targetAudience === 'both') {
      const users = await this.bulkCreateToUsers(rest);
      const astrologers = await this.bulkCreateToAstrologers(rest);
      return [...users, ...astrologers];
    }

    const [r] = await this.db.insert(schema.notifications).values(rest).returning();
    const targetId = r.userId || r.astrologerId;
    if (targetId) this.realtime.emitToUser(targetId, 'notification:new', r);
    return r;
  }

  private async bulkCreateToUsers(data: any) {
    const users = await this.db.query.users.findMany({ where: eq(schema.users.isActive, true), columns: { id: true } });
    if (users.length === 0) return [];
    const values = users.map(u => ({ ...data, userId: u.id, astrologerId: null }));
    const created = await this.db.insert(schema.notifications).values(values).returning();
    for (const n of created) {
      this.realtime.emitToUser(n.userId!, 'notification:new', n);
    }
    return created;
  }

  private async bulkCreateToAstrologers(data: any) {
    const astrologers = await this.db.query.astrologers.findMany({ columns: { userId: true } });
    if (astrologers.length === 0) return [];
    const values = astrologers.map(a => ({ ...data, astrologerId: a.userId, userId: null }));
    const created = await this.db.insert(schema.notifications).values(values).returning();
    for (const n of created) {
      this.realtime.emitToUser(n.astrologerId!, 'notification:new', n);
    }
    return created;
  }

  async markAsRead(id: string) {
    const [r] = await this.db.update(schema.notifications).set({ isRead: true, readAt: new Date() }).where(eq(schema.notifications.id, id)).returning(); return r;
  }

  async markAllAsRead(userId?: string, astrologerId?: string) {
    const where = userId ? eq(schema.notifications.userId, userId) : eq(schema.notifications.astrologerId, astrologerId!);
    await this.db.update(schema.notifications).set({ isRead: true, readAt: new Date() }).where(where);
  }
}
