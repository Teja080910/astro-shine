import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class ReportsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.reports.findMany(); }
  async findById(id: string) { return this.db.query.reports.findFirst({ where: eq(schema.reports.id, id) }); }

  async create(data: typeof schema.reports.$inferInsert) { const [r] = await this.db.insert(schema.reports).values(data).returning(); return r; }

  async resolve(id: string, adminId: string) {
    const [r] = await this.db.update(schema.reports)
      .set({ status: 'reviewed', resolvedBy: adminId, resolvedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.reports.id, id)).returning(); return r;
  }
}
