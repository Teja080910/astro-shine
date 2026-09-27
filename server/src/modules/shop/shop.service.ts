import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc, and, or, ilike, sql, SQL } from 'drizzle-orm';
import {
  paginated,
  Pagination,
} from '../../common/utils/pagination';

@Injectable()
export class ShopService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  private searchWhere(q?: string): SQL | undefined {
    if (!q) return undefined;
    const pattern = `%${q}%`;
    return or(
      ilike(schema.shopProducts.name, pattern),
      ilike(schema.shopProducts.category, pattern),
      ilike(schema.shopProducts.description, pattern),
    );
  }

  async findAll(pagination?: Pagination) {
    const where = this.searchWhere(pagination?.q);

    if (!pagination?.enabled) {
      return this.db.query.shopProducts.findMany({
        where,
        orderBy: [desc(schema.shopProducts.createdAt)],
      });
    }

    const [data, countRows] = await Promise.all([
      this.db.query.shopProducts.findMany({
        where,
        orderBy: [desc(schema.shopProducts.createdAt)],
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.shopProducts)
        .where(where),
    ]);
    return paginated(data, Number(countRows[0]?.count || 0), pagination);
  }

  async findById(id: string) { return this.db.query.shopProducts.findFirst({ where: eq(schema.shopProducts.id, id) }); }

  async findByCategory(category: string, pagination?: Pagination) {
    const where = and(
      eq(schema.shopProducts.category, category),
      this.searchWhere(pagination?.q),
    );

    if (!pagination?.enabled) {
      return this.db.query.shopProducts.findMany({
        where,
        orderBy: [desc(schema.shopProducts.createdAt)],
      });
    }

    const [data, countRows] = await Promise.all([
      this.db.query.shopProducts.findMany({
        where,
        orderBy: [desc(schema.shopProducts.createdAt)],
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.shopProducts)
        .where(where),
    ]);
    return paginated(data, Number(countRows[0]?.count || 0), pagination);
  }

  async create(data: typeof schema.shopProducts.$inferInsert) { const [r] = await this.db.insert(schema.shopProducts).values(data).returning(); return r; }
  async update(id: string, data: Partial<typeof schema.shopProducts.$inferInsert>) {
    const [r] = await this.db.update(schema.shopProducts).set({ ...data, updatedAt: new Date() }).where(eq(schema.shopProducts.id, id)).returning(); return r;
  }
  async delete(id: string) { await this.db.delete(schema.shopProducts).where(eq(schema.shopProducts.id, id)); }
}
