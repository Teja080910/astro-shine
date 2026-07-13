import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class CommissionService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() {
    return this.db
      .select({
        id: schema.commissions.id,
        astrologerId: schema.commissions.astrologerId,
        astrologerName: schema.astrologers.name,
        type: schema.commissions.type,
        value: schema.commissions.value,
        minAmount: schema.commissions.minAmount,
        maxCap: schema.commissions.maxCap,
        isActive: schema.commissions.isActive,
        createdAt: schema.commissions.createdAt,
        updatedAt: schema.commissions.updatedAt,
      })
      .from(schema.commissions)
      .leftJoin(schema.astrologers, eq(schema.commissions.astrologerId, schema.astrologers.id));
  }
  async findByAstrologerId(astrologerId: string) { return this.db.query.commissions.findFirst({ where: eq(schema.commissions.astrologerId, astrologerId) }); }

  async create(data: typeof schema.commissions.$inferInsert) {
    const [r] = await this.db.insert(schema.commissions).values(data).returning(); return r;
  }

  async update(id: string, data: Partial<typeof schema.commissions.$inferInsert>) {
    const [r] = await this.db.update(schema.commissions).set({ ...data, updatedAt: new Date() }).where(eq(schema.commissions.id, id)).returning(); return r;
  }

  async getLogs(astrologerId?: string) {
    if (astrologerId) return this.db.query.commissionLogs.findMany({ where: eq(schema.commissionLogs.astrologerId, astrologerId) });
    return this.db.query.commissionLogs.findMany();
  }
}
