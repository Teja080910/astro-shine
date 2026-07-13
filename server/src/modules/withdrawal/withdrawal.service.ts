import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class WithdrawalService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findByAstrologerId(astrologerId: string) { return this.db.query.withdrawalRequests.findMany({ where: eq(schema.withdrawalRequests.astrologerId, astrologerId) }); }
  async findAll() {
    return this.db
      .select({
        id: schema.withdrawalRequests.id,
        astrologerId: schema.withdrawalRequests.astrologerId,
        astrologerName: schema.astrologers.name,
        amount: schema.withdrawalRequests.amount,
        status: schema.withdrawalRequests.status,
        bankAccount: schema.withdrawalRequests.bankAccount,
        adminNote: schema.withdrawalRequests.adminNote,
        createdAt: schema.withdrawalRequests.createdAt,
        updatedAt: schema.withdrawalRequests.updatedAt,
      })
      .from(schema.withdrawalRequests)
      .leftJoin(schema.astrologers, eq(schema.withdrawalRequests.astrologerId, schema.astrologers.id));
  }

  async create(data: typeof schema.withdrawalRequests.$inferInsert) {
    const [r] = await this.db.insert(schema.withdrawalRequests).values(data).returning(); return r;
  }

  async approve(id: string, adminId: string) {
    const [r] = await this.db.update(schema.withdrawalRequests)
      .set({ status: 'approved', processedBy: adminId, processedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.withdrawalRequests.id, id)).returning(); return r;
  }

  async reject(id: string, adminId: string, note?: string) {
    const [r] = await this.db.update(schema.withdrawalRequests)
      .set({ status: 'rejected', processedBy: adminId, processedAt: new Date(), adminNote: note, updatedAt: new Date() })
      .where(eq(schema.withdrawalRequests.id, id)).returning(); return r;
  }
}
