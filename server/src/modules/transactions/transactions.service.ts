import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class TransactionsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll(limit = 50) {
    const rows = await this.db
      .select({
        id: schema.transactions.id,
        walletId: schema.transactions.walletId,
        userId: schema.transactions.userId,
        astrologerId: schema.transactions.astrologerId,
        type: schema.transactions.type,
        category: schema.transactions.category,
        amount: schema.transactions.amount,
        fee: schema.transactions.fee,
        netAmount: schema.transactions.netAmount,
        status: schema.transactions.status,
        referenceId: schema.transactions.referenceId,
        description: schema.transactions.description,
        createdAt: schema.transactions.createdAt,
        updatedAt: schema.transactions.updatedAt,
        userName: schema.users.name,
        astrologerName: schema.astrologers.name,
      })
      .from(schema.transactions)
      .leftJoin(schema.users, eq(schema.transactions.userId, schema.users.id))
      .leftJoin(schema.astrologers, eq(schema.transactions.astrologerId, schema.astrologers.id))
      .orderBy(desc(schema.transactions.createdAt))
      .limit(limit);
    return rows;
  }
  async findByWalletId(walletId: string) { return this.db.query.transactions.findMany({ where: eq(schema.transactions.walletId, walletId), orderBy: [desc(schema.transactions.createdAt)] }); }
  async findByUserId(userId: string) { return this.db.query.transactions.findMany({ where: eq(schema.transactions.userId, userId), orderBy: [desc(schema.transactions.createdAt)] }); }
  async findByUserIdOrAstrologerId(userId: string) {
    const byUser = await this.db.query.transactions.findMany({ where: eq(schema.transactions.userId, userId), orderBy: [desc(schema.transactions.createdAt)] });
    const byAstrologer = await this.db.query.transactions.findMany({ where: eq(schema.transactions.astrologerId, userId), orderBy: [desc(schema.transactions.createdAt)] });
    const merged = [...byUser, ...byAstrologer];
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return merged;
  }
  async findById(id: string) { return this.db.query.transactions.findFirst({ where: eq(schema.transactions.id, id) }); }

  async create(data: typeof schema.transactions.$inferInsert) {
    const [r] = await this.db.insert(schema.transactions).values(data).returning(); return r;
  }

  async updateStatus(id: string, status: 'pending' | 'success' | 'failed' | 'refunded') {
    const [r] = await this.db.update(schema.transactions).set({ status, updatedAt: new Date() }).where(eq(schema.transactions.id, id)).returning(); return r;
  }
}
