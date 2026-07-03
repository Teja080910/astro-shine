import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class ShopService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.shopProducts.findMany(); }
  async findById(id: string) { return this.db.query.shopProducts.findFirst({ where: eq(schema.shopProducts.id, id) }); }
  async findByCategory(category: string) { return this.db.query.shopProducts.findMany({ where: eq(schema.shopProducts.category, category) }); }

  async create(data: typeof schema.shopProducts.$inferInsert) { const [r] = await this.db.insert(schema.shopProducts).values(data).returning(); return r; }
  async update(id: string, data: Partial<typeof schema.shopProducts.$inferInsert>) {
    const [r] = await this.db.update(schema.shopProducts).set({ ...data, updatedAt: new Date() }).where(eq(schema.shopProducts.id, id)).returning(); return r;
  }
}
