import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class TransactionsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll(limit = 50) { return this.db.query.transactions.findMany({ limit, orderBy: [desc(schema.transactions.createdAt)] }); }
  async findByWalletId(walletId: string) { return this.db.query.transactions.findMany({ where: eq(schema.transactions.walletId, walletId), orderBy: [desc(schema.transactions.createdAt)] }); }
  async findById(id: string) { return this.db.query.transactions.findFirst({ where: eq(schema.transactions.id, id) }); }

  async create(data: typeof schema.transactions.$inferInsert) {
    const [r] = await this.db.insert(schema.transactions).values(data).returning(); return r;
  }

  async updateStatus(id: string, status: 'pending' | 'success' | 'failed' | 'refunded') {
    const [r] = await this.db.update(schema.transactions).set({ status, updatedAt: new Date() }).where(eq(schema.transactions.id, id)).returning(); return r;
  }
}
