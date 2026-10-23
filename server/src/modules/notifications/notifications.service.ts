import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc, sql, or, and, isNull, inArray, lt } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { PushService } from './push.service';
import {
  paginated,
  Pagination,
} from '../../common/utils/pagination';

const NOTIFICATION_RETENTION_DAYS = 30;

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
    private readonly push: PushService,
  ) {}

  async onModuleInit() {
    await this.cleanupExpiredNotifications().catch((e: any) =>
      this.logger.warn(`Notification cleanup failed: ${e?.message || e}`),
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredNotifications() {
    const cutoff = new Date(
      Date.now() - NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    const deleted = await this.db
      .delete(schema.notifications)
      .where(lt(schema.notifications.createdAt, cutoff))
      .returning({ id: schema.notifications.id });
    if (deleted.length > 0) {
      this.logger.log(
        `Deleted ${deleted.length} notifications older than ${NOTIFICATION_RETENTION_DAYS} days`,
      );
    }
    return { deleted: deleted.length };
  }

  async findByUserId(userId: string) {
    return this.db.query.notifications.findMany({
      where: or(
        eq(schema.notifications.userId, userId),
        // App-wide broadcasts only. Astrologer-only notifications also have a
        // null userId and must never leak into a user's inbox.
        and(
          isNull(schema.notifications.userId),
          isNull(schema.notifications.astrologerId),
        ),
      ),
      orderBy: desc(schema.notifications.createdAt),
    });
  }
  async findByAstrologerId(astrologerId: string) {
    return this.db.query.notifications.findMany({
      where: or(
        eq(schema.notifications.astrologerId, astrologerId),
        // App-wide broadcasts only. User-only notifications also have a null
        // astrologerId and must never leak into an astrologer's inbox.
        and(
          isNull(schema.notifications.userId),
          isNull(schema.notifications.astrologerId),
        ),
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
      return this.enrichGiftRows(rows.rows as any[]);
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
    return paginated(
      await this.enrichGiftRows(rows.rows as any[]),
      Number(count.rows[0]?.count || 0),
      pagination,
    );
  }

  /**
   * Gift notifications created before the sender/receiver details were stored
   * on `data` only carry a gift id. Resolve the gift, amount and the two people
   * involved so the admin log can render a neutral third-person summary
   * instead of the recipient-facing "You received..." copy.
   */
  private async enrichGiftRows(rows: any[]) {
    const giftRows = (rows || []).filter((row) => {
      const type = row?.data?.type;
      return typeof type === 'string' && type.startsWith('gift_');
    });
    if (giftRows.length === 0) return rows;

    const giftIds = [
      ...new Set(
        giftRows
          .map((row) => row?.data?.giftId)
          .filter((id): id is string => typeof id === 'string'),
      ),
    ];

    const [giftList, giftTxns] = await Promise.all([
      giftIds.length
        ? this.db
            .select({
              id: schema.gifts.id,
              name: schema.gifts.name,
              price: schema.gifts.price,
            })
            .from(schema.gifts)
            .where(inArray(schema.gifts.id, giftIds))
        : [],
      giftIds.length
        ? this.db
            .select({
              giftId: schema.giftTransactions.giftId,
              senderId: schema.giftTransactions.senderId,
              receiverId: schema.giftTransactions.receiverId,
              createdAt: schema.giftTransactions.createdAt,
            })
            .from(schema.giftTransactions)
            .where(inArray(schema.giftTransactions.giftId, giftIds))
        : [],
    ]);

    const giftsById = new Map(giftList.map((gift) => [gift.id, gift]));
    const txnsByGift = new Map<string, any[]>();
    for (const txn of giftTxns) {
      const list = txnsByGift.get(txn.giftId) || [];
      list.push(txn);
      txnsByGift.set(txn.giftId, list);
    }

    // Match each notification to its gift transaction: same gift, same
    // receiver, closest in time to the notification.
    const matchedTxns = new Map<any, any>();
    for (const row of giftRows) {
      const receiverId = row?.data?.receiverId || row?.astrologerId;
      const candidates = (
        txnsByGift.get(row?.data?.giftId) || []
      ).filter((txn) => !receiverId || txn.receiverId === receiverId);
      const createdAt = new Date(row.createdAt).getTime();
      candidates.sort(
        (a, b) =>
          Math.abs(new Date(a.createdAt).getTime() - createdAt) -
          Math.abs(new Date(b.createdAt).getTime() - createdAt),
      );
      matchedTxns.set(row, candidates[0]);
    }

    const userIds = new Set<string>();
    const addUser = (id?: string | null) => {
      if (id) userIds.add(id);
    };
    for (const row of giftRows) {
      const data = row?.data || {};
      const txn = matchedTxns.get(row);
      addUser(data.senderId);
      addUser(data.receiverId);
      addUser(row.userId);
      addUser(row.astrologerId);
      addUser(txn?.senderId);
      addUser(txn?.receiverId);
    }

    const users = userIds.size
      ? await this.db
          .select({ id: schema.users.id, name: schema.users.name })
          .from(schema.users)
          .where(inArray(schema.users.id, [...userIds]))
      : [];
    const namesById = new Map(users.map((user) => [user.id, user.name]));

    for (const row of giftRows) {
      const data = row?.data || {};
      const txn = matchedTxns.get(row);
      const gift = giftsById.get(data.giftId);
      const senderId = data.senderId || row.userId || txn?.senderId;
      const receiverId =
        data.receiverId || row.astrologerId || txn?.receiverId;
      row.data = {
        ...data,
        giftName: data.giftName || gift?.name,
        amount:
          data.amount || (gift ? Number(gift.price).toFixed(2) : undefined),
        senderId,
        receiverId,
        senderName: data.senderName || namesById.get(senderId),
        receiverName: data.receiverName || namesById.get(receiverId),
      };
    }

    return rows;
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

  /**
   * Fan a notification out to every active admin. Admin inbox entries are
   * stored against the admin's user id, so they appear in the admin panel and
   * in that admin's notification list.
   */
  async notifyAdmins(payload: {
    title: string;
    body: string;
    type?: string;
    data?: Record<string, any>;
  }) {
    const admins = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.role, 'admin'),
          eq(schema.users.isActive, true),
          isNull(schema.users.deletedAt),
        ),
      );
    const ids = [...new Set(admins.map((admin) => admin.id))];
    if (ids.length === 0) return [];

    const created: any[] = [];
    for (const userId of ids) {
      created.push(
        await this.create({
          userId,
          type: payload.type || 'system',
          title: payload.title,
          body: payload.body,
          data: { audience: 'admin', ...(payload.data || {}) },
        }),
      );
    }
    return created;
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
      where: and(
        eq(schema.users.role, 'user'),
        eq(schema.users.isActive, true),
        isNull(schema.users.deletedAt),
      ),
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
    const astrologers = await this.db
      .select({ userId: schema.astrologers.userId })
      .from(schema.astrologers)
      .innerJoin(schema.users, eq(schema.users.id, schema.astrologers.userId))
      .where(
        and(
          eq(schema.users.isActive, true),
          isNull(schema.users.deletedAt),
        ),
      );
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
