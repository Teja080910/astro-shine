import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql, desc } from 'drizzle-orm';

@Injectable()
export class TransactionsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll(limit = 50) {
    const result = await this.db.execute<{
      id: string; wallet_id: string; user_id: string; astrologer_id: string;
      type: string; category: string; amount: string; fee: string; net_amount: string;
      status: string; reference_id: string; description: string;
      created_at: string; updated_at: string;
      user_name: string; astrologer_name: string;
    }>(sql`
      SELECT t.id, t.wallet_id, t.user_id, t.astrologer_id, t.type, t.category,
             t.amount, t.fee, t.net_amount, t.status, t.reference_id,
             t.description, t.created_at, t.updated_at,
             COALESCE(u1.name, '') AS user_name,
             COALESCE(u2.name, '') AS astrologer_name
      FROM transactions t
      LEFT JOIN users u1 ON t.user_id = u1.id
      LEFT JOIN astrologers a ON t.astrologer_id = a.user_id
      LEFT JOIN users u2 ON a.user_id = u2.id
      ORDER BY t.created_at DESC
      LIMIT ${limit}
    `);
    return result.rows.map(r => ({
      id: r.id, walletId: r.wallet_id, userId: r.user_id, astrologerId: r.astrologer_id,
      type: r.type, category: r.category, amount: r.amount, fee: r.fee, netAmount: r.net_amount,
      status: r.status, referenceId: r.reference_id, description: r.description,
      createdAt: r.created_at, updatedAt: r.updated_at,
      userName: r.user_name, astrologerName: r.astrologer_name,
    }));
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
