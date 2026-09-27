import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, or, desc, sql } from 'drizzle-orm';
import { paginated, Pagination } from '../../common/utils/pagination';

@Injectable()
export class ReportsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll(pagination?: Pagination) {
    if (!pagination?.enabled) return this.db.query.reports.findMany();
    let where: any;
    if (pagination.q) {
      const pattern = `%${pagination.q}%`;
      where = or(
        sql`${schema.reports.reason}::text ILIKE ${pattern}`,
        sql`${schema.reports.status}::text ILIKE ${pattern}`,
      );
    }
    const [data, countRows] = await Promise.all([
      this.db.select().from(schema.reports).where(where)
        .orderBy(desc(schema.reports.createdAt))
        .limit(pagination.limit).offset(pagination.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.reports).where(where),
    ]);
    return paginated(data, countRows[0]?.count ?? 0, pagination);
  }
  async findById(id: string) { return this.db.query.reports.findFirst({ where: eq(schema.reports.id, id) }); }

  async create(data: typeof schema.reports.$inferInsert) { const [r] = await this.db.insert(schema.reports).values(data).returning(); return r; }

  async resolve(id: string, adminId: string) {
    const [r] = await this.db.update(schema.reports)
      .set({ status: 'reviewed', resolvedBy: adminId, resolvedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.reports.id, id)).returning(); return r;
  }
}
