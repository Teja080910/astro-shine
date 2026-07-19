import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql, desc } from 'drizzle-orm';
import { WalletService } from '../wallet/wallet.service';

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

  async getLogs() {
    return this.db
      .select()
      .from(schema.donationLogs)
      .orderBy(desc(schema.donationLogs.createdAt));
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
    const stats = await this.getStats();
    if (data.amount > stats.pending) {
      throw new BadRequestException('Insufficient donation balance');
    }

    const amountStr = data.amount.toFixed(2);
    const adminWallet = await this.walletService.getWalletByAdminId(data.adminId);
    if (!adminWallet) {
      throw new BadRequestException('Admin wallet not found');
    }

    await this.db.transaction(async (tx) => {
      const wResult = await tx.execute<{ id: string; balance: string }>(
        sql`SELECT id, balance FROM wallets WHERE admin_id = ${data.adminId} LIMIT 1 FOR UPDATE`,
      );
      const w = wResult.rows?.[0];
      if (!w) throw new BadRequestException('Admin wallet not found');

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
