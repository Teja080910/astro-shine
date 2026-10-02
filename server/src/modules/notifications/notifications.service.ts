import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc, sql, or, isNull } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { PushService } from './push.service';
import {
  paginated,
  Pagination,
} from '../../common/utils/pagination';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
    private readonly push: PushService,
  ) {}

  async findByUserId(userId: string) {
    return this.db.query.notifications.findMany({
      where: or(
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.userId),
      ),
      orderBy: desc(schema.notifications.createdAt),
    });
  }
  async findByAstrologerId(astrologerId: string) {
    return this.db.query.notifications.findMany({
      where: or(
        eq(schema.notifications.astrologerId, astrologerId),
        isNull(schema.notifications.astrologerId),
      ),
      orderBy: desc(schema.notifications.createdAt),
    });
  }
  async findAll(pagination?: Pagination) {
    const pattern = pagination?.q ? `%${pagination.q}%` : undefined;
    const searchClause = pattern
      ? sql`AND (n.title ILIKE ${pattern} OR n.body ILIKE ${pattern} OR n.type::text ILIKE ${pattern})`
      : sql``;

    const selectClause = sql`
      SELECT
        n.id, n.user_id as "userId", n.astrologer_id as "astrologerId",
        n.type, n.title, n.body, n.data, n.is_read as "isRead",
        n.read_at as "readAt", n.image, n.created_at as "createdAt",
        COALESCE(u.name, au.name) as "targetName"
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN astrologers a ON n.astrologer_id = a.user_id
      LEFT JOIN users au ON a.user_id = au.id
      WHERE 1 = 1
      ${searchClause}
      ORDER BY n.created_at DESC
    `;

    if (!pagination?.enabled) {
      const rows = await this.db.execute(selectClause);
      return rows.rows;
    }

    const [rows, count] = await Promise.all([
      this.db.execute(
        sql`${selectClause} LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
      ),
      this.db.execute<{ count: number }>(sql`
        SELECT COUNT(*)::int AS count
        FROM notifications n
        WHERE 1 = 1
        ${searchClause}
      `),
    ]);
    return paginated(rows.rows, Number(count.rows[0]?.count || 0), pagination);
  }
  async findById(id: string) {
    return this.db.query.notifications.findFirst({
      where: eq(schema.notifications.id, id),
    });
  }

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

    const [r] = await this.db
      .insert(schema.notifications)
      .values(rest)
      .returning();
    const targetId = r.userId || r.astrologerId;
    if (targetId) this.realtime.emitToUser(targetId, 'notification:new', r);
    await this.sendPushToTargets(targetId ? [targetId] : [], r);
    return r;
  }

  private async sendPushToTargets(userIds: string[], notification: any) {
    if (userIds.length === 0) return;
    try {
      await this.push.sendToUsers(userIds, {
        title: notification.title,
        body: notification.body,
        data: {
          ...((notification.data as Record<string, any>) || {}),
          type: notification.type,
        },
        image: notification.image,
      });
    } catch (e) {
      this.logger.warn(`Push notification skipped: ${(e as Error)?.message}`);
    }
  }

  private async bulkCreateToUsers(data: any) {
    const users = await this.db.query.users.findMany({
      where: eq(schema.users.isActive, true),
      columns: { id: true },
    });
    if (users.length === 0) return [];
    const values = users.map((u) => ({
      ...data,
      userId: u.id,
      astrologerId: null,
    }));
    const created = await this.db
      .insert(schema.notifications)
      .values(values)
      .returning();
    for (const n of created) {
      this.realtime.emitToUser(n.userId!, 'notification:new', n);
    }
    await this.sendPushToTargets(
      created.map((n) => n.userId!).filter(Boolean),
      created[0],
    );
    return created;
  }

  private async bulkCreateToAstrologers(data: any) {
    const astrologers = await this.db.query.astrologers.findMany({
      columns: { userId: true },
    });
    if (astrologers.length === 0) return [];
    const values = astrologers.map((a) => ({
      ...data,
      astrologerId: a.userId,
      userId: null,
    }));
    const created = await this.db
      .insert(schema.notifications)
      .values(values)
      .returning();
    for (const n of created) {
      this.realtime.emitToUser(n.astrologerId!, 'notification:new', n);
    }
    await this.sendPushToTargets(
      created.map((n) => n.astrologerId!).filter(Boolean),
      created[0],
    );
    return created;
  }

  async registerPushToken(userId: string, token: string) {
    return this.push.registerToken(userId, token);
  }

  async clearPushToken(userId: string) {
    return this.push.clearToken(userId);
  }

  async markAsRead(id: string) {
    const [r] = await this.db
      .update(schema.notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(schema.notifications.id, id))
      .returning();
    return r;
  }

  async markAllAsRead(userId?: string, astrologerId?: string) {
    const where = userId
      ? eq(schema.notifications.userId, userId)
      : eq(schema.notifications.astrologerId, astrologerId!);
    await this.db
      .update(schema.notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(where);
  }
}
