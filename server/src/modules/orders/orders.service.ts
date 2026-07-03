import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class OrdersService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findByUserId(userId: string) { return this.db.query.orders.findMany({ where: eq(schema.orders.userId, userId) }); }
  async findById(id: string) { return this.db.query.orders.findFirst({ where: eq(schema.orders.id, id) }); }
  async findAll() { return this.db.query.orders.findMany(); }

  async create(data: typeof schema.orders.$inferInsert) { const [r] = await this.db.insert(schema.orders).values(data).returning(); return r; }

  async updateStatus(id: string, status: string) {
    const [r] = await this.db.update(schema.orders).set({ status, updatedAt: new Date() }).where(eq(schema.orders.id, id)).returning(); return r;
  }

  async addItem(data: typeof schema.orderItems.$inferInsert) { const [r] = await this.db.insert(schema.orderItems).values(data).returning(); return r; }
  async getItems(orderId: string) { return this.db.query.orderItems.findMany({ where: eq(schema.orderItems.orderId, orderId) }); }
}
