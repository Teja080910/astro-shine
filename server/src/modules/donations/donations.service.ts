import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql, desc, or, ilike } from 'drizzle-orm';
import { WalletService } from '../wallet/wallet.service';
import { paginated, Pagination } from '../../common/utils/pagination';

@Injectable()
export class DonationsService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly walletService: WalletService,
  ) {}

  async getStats() {
    const [received] = await this.db
      .select({ sum: sql<string>`COALESCE(SUM(amount::decimal), 0)` })
      .from(schema.donationLogs)
      .where(eq(schema.donationLogs.type, 'received'));
    const [withdrawn] = await this.db
      .select({ sum: sql<string>`COALESCE(SUM(amount::decimal), 0)` })
      .from(schema.donationLogs)
      .where(eq(schema.donationLogs.type, 'withdrawn'));
    const totalReceived = Number(received.sum);
    const totalWithdrawn = Number(withdrawn.sum);
    return {
      totalReceived,
      totalWithdrawn,
      pending: totalReceived - totalWithdrawn,
    };
  }

  async getLogs(pagination?: Pagination) {
    const pattern = pagination?.q ? `%${pagination.q}%` : undefined;
    const where = pattern
      ? or(
          ilike(schema.donationLogs.type, pattern),
          ilike(schema.donationLogs.note, pattern),
        )
      : undefined;

    const build = () =>
      this.db
        .select()
        .from(schema.donationLogs)
        .where(where)
        .orderBy(desc(schema.donationLogs.createdAt));

    if (!pagination?.enabled) return build();

    const [rows, countRows] = await Promise.all([
      build().limit(pagination.limit).offset(pagination.offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.donationLogs)
        .where(where),
    ]);

    return paginated(rows, Number(countRows[0].count), pagination);
  }

  async findAll(pagination?: Pagination) {
    const build = () =>
      this.db
        .select()
        .from(schema.donations)
        .orderBy(desc(schema.donations.createdAt));

    if (!pagination?.enabled) return build();

    const [rows, countRows] = await Promise.all([
      build().limit(pagination.limit).offset(pagination.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.donations),
    ]);

    return paginated(rows, Number(countRows[0].count), pagination);
  }

  async findByUserId(userId: string) {
    return this.db
      .select()
      .from(schema.donations)
      .where(eq(schema.donations.userId, userId))
      .orderBy(desc(schema.donations.createdAt));
  }

  async create(data: { userId?: string; amount: string; transactionId?: string; message?: string }) {
    const [r] = await this.db.insert(schema.donations).values({
      userId: data.userId || null,
      amount: data.amount,
      transactionId: data.transactionId || null,
      message: data.message || null,
    }).returning();
    await this.db.insert(schema.donationLogs).values({
      userId: data.userId || null,
      type: 'received',
      amount: data.amount,
      note: data.message || null,
    });
    return r;
  }

  async createReceived(data: { amount: number; userId?: string; note?: string }) {
    const [r] = await this.db.insert(schema.donationLogs).values({
      userId: data.userId || null,
      type: 'received',
      amount: data.amount.toFixed(2),
      note: data.note || null,
    }).returning();
    return r;
  }

  async createWithdrawn(data: { adminId: string; amount: number; note?: string }) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid withdrawal amount');
    }
    const amountStr = amount.toFixed(2);

    const adminWallet = await this.walletService.getOrCreateAdminWalletFor(data.adminId);

    await this.db.transaction(async (tx) => {
      const wResult = await tx.execute<{ id: string; balance: string }>(
        sql`SELECT id, balance FROM wallets WHERE id = ${adminWallet.id} LIMIT 1 FOR UPDATE`,
      );
      const w = wResult.rows?.[0];
      if (!w) throw new BadRequestException('Admin wallet not found');

      const receivedResult = await tx.execute<{ sum: string }>(
        sql`SELECT COALESCE(SUM(amount::decimal), 0) as sum FROM donation_logs WHERE type = 'received'`,
      );
      const withdrawnResult = await tx.execute<{ sum: string }>(
        sql`SELECT COALESCE(SUM(amount::decimal), 0) as sum FROM donation_logs WHERE type = 'withdrawn'`,
      );
      const pending = Number(receivedResult.rows[0].sum) - Number(withdrawnResult.rows[0].sum);

      if (amount > pending) {
        throw new BadRequestException('Insufficient donation balance');
      }

      await tx
        .update(schema.wallets)
        .set({
          balance: sql`${schema.wallets.balance} + ${amountStr}::decimal`,
          totalAdded: sql`${schema.wallets.totalAdded} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.wallets.id, w.id));

      await tx.insert(schema.transactions).values({
        walletId: w.id,
        type: 'credit',
        category: 'donation',
        amount: amountStr,
        fee: '0',
        netAmount: amountStr,
        status: 'success',
        description: `Donation withdrawal - ${data.note || 'No note'}`,
      });

      await tx.insert(schema.donationLogs).values({
        adminId: data.adminId,
        type: 'withdrawn',
        amount: amountStr,
        note: data.note || null,
      });
    });
  }
}
