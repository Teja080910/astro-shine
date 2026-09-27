import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc, inArray, or, ilike, sql } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { paginated, Pagination } from '../../common/utils/pagination';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  private itemSelection() {
    return {
      id: schema.orderItems.id,
      orderId: schema.orderItems.orderId,
      productId: schema.orderItems.productId,
      productName: schema.shopProducts.name,
      productImages: schema.shopProducts.images,
      quantity: schema.orderItems.quantity,
      unitPrice: schema.orderItems.unitPrice,
      totalPrice: schema.orderItems.totalPrice,
      createdAt: schema.orderItems.createdAt,
    };
  }

  private mapItem(row: any) {
    const { productImages, ...rest } = row;
    return { ...rest, productImage: productImages?.[0] || null };
  }

  private async attachItems<T extends { id: string }>(orders: T[]) {
    if (orders.length === 0)
      return orders.map((o) => ({ ...o, items: [] as any[] }));

    const rows = await this.db
      .select(this.itemSelection())
      .from(schema.orderItems)
      .leftJoin(
        schema.shopProducts,
        eq(schema.orderItems.productId, schema.shopProducts.id),
      )
      .where(
        inArray(
          schema.orderItems.orderId,
          orders.map((o) => o.id),
        ),
      );

    const byOrder = new Map<string, any[]>();
    for (const row of rows) {
      const list = byOrder.get(row.orderId) || [];
      list.push(this.mapItem(row));
      byOrder.set(row.orderId, list);
    }

    return orders.map((o) => ({ ...o, items: byOrder.get(o.id) || [] }));
  }

  async findByUserId(userId: string) {
    const orders = await this.db.query.orders.findMany({
      where: eq(schema.orders.userId, userId),
      orderBy: [desc(schema.orders.createdAt)],
    });
    return this.attachItems(orders);
  }

  async findById(id: string) {
    return this.db.query.orders.findFirst({ where: eq(schema.orders.id, id) });
  }

  async findAll(pagination?: Pagination) {
    const pattern = pagination?.q ? `%${pagination.q}%` : undefined;
    const where = pattern
      ? or(
          ilike(schema.orders.status, pattern),
          sql`${schema.orders.id}::text ILIKE ${pattern}`,
        )
      : undefined;

    const build = () =>
      this.db
        .select({
          id: schema.orders.id,
          userId: schema.orders.userId,
          userName: schema.users.name,
          totalAmount: schema.orders.totalAmount,
          status: schema.orders.status,
          shippingAddress: schema.orders.shippingAddress,
          createdAt: schema.orders.createdAt,
          updatedAt: schema.orders.updatedAt,
        })
        .from(schema.orders)
        .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
        .where(where)
        .orderBy(desc(schema.orders.createdAt));

    if (!pagination?.enabled) return build();

    const [rows, countRows] = await Promise.all([
      build().limit(pagination.limit).offset(pagination.offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.orders)
        .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
        .where(where),
    ]);

    return paginated(rows, Number(countRows[0].count), pagination);
  }

  async create(data: typeof schema.orders.$inferInsert) {
    const [r] = await this.db.insert(schema.orders).values(data).returning();
    return r;
  }

  async updateStatus(id: string, status: string) {
    const normalizedStatus = (status || '').toLowerCase().trim();
    if (!ORDER_STATUSES.includes(normalizedStatus)) {
      throw new BadRequestException(
        `Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}`,
      );
    }
    const [r] = await this.db
      .update(schema.orders)
      .set({ status: normalizedStatus, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    if (!r) return r;

    this.realtime.emitToUser(r.userId, 'order:updated', {
      orderId: r.id,
      status: r.status,
    });

    if (normalizedStatus === 'delivered') {
      const shortId = r.id.slice(0, 8).toUpperCase();
      try {
        await this.notifications.create({
          userId: r.userId,
          type: 'transactional',
          title: 'Order Delivered',
          body: `Your order #${shortId} has been delivered. Tap to view the details.`,
          data: { screen: 'OrderHistory', orderId: r.id },
        });
      } catch (e) {
        this.logger.warn(
          `Order delivered notification failed: ${(e as Error)?.message}`,
        );
      }
    }

    return r;
  }

  async addItem(data: typeof schema.orderItems.$inferInsert) {
    const [r] = await this.db
      .insert(schema.orderItems)
      .values(data)
      .returning();
    return r;
  }

  async getItems(orderId: string) {
    const rows = await this.db
      .select(this.itemSelection())
      .from(schema.orderItems)
      .leftJoin(
        schema.shopProducts,
        eq(schema.orderItems.productId, schema.shopProducts.id),
      )
      .where(eq(schema.orderItems.orderId, orderId));
    return rows.map((row) => this.mapItem(row));
  }
}
