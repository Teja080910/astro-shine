import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, sql, desc } from 'drizzle-orm';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly walletService: WalletService,
  ) {}

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

  async getLogs(astrologerId?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const whereClause = astrologerId ? eq(schema.commissionLogs.astrologerId, astrologerId) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(schema.commissionLogs)
        .where(whereClause)
        .orderBy(desc(schema.commissionLogs.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.commissionLogs)
        .where(whereClause),
    ]);
    return { data, total: Number(totalResult[0].count), page, limit };
  }

  async getAstrologerStats(astrologerId: string) {
    const [totalEarnings, totalPlatformFee, totalCalls, comm] = await Promise.all([
      this.db
        .select({ total: sql<string>`COALESCE(SUM(total_earned::decimal), 0)` })
        .from(schema.commissionLogs)
        .where(eq(schema.commissionLogs.astrologerId, astrologerId)),
      this.db
        .select({ total: sql<string>`COALESCE(SUM(platform_fee::decimal), 0)` })
        .from(schema.commissionLogs)
        .where(eq(schema.commissionLogs.astrologerId, astrologerId)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.commissionLogs)
        .where(eq(schema.commissionLogs.astrologerId, astrologerId)),
      this.findByAstrologerId(astrologerId),
    ]);
    return {
      totalEarnings: Number(totalEarnings[0].total),
      totalPlatformFee: Number(totalPlatformFee[0].total),
      totalCalls: Number(totalCalls[0].count),
      commissionPercentage: comm?.isActive ? parseFloat(comm.value) : 10,
    };
  }

  async distributeEarnings(astrologerId: string, callId: string, totalCost: number): Promise<void> {
    const commission = await this.findByAstrologerId(astrologerId);
    const percentage = commission && commission.isActive ? parseFloat(commission.value) : 10;
    const effectivePercentage = Math.max(0, Math.min(100, percentage));
    const platformFee = (totalCost * effectivePercentage) / 100;
    const astrologerEarnings = totalCost - platformFee;

    await this.db.transaction(async (tx) => {
      // Idempotency: skip if commission already logged for this call
      const [existingLog] = await tx
        .select()
        .from(schema.commissionLogs)
        .where(eq(schema.commissionLogs.callId, callId))
        .limit(1);
      if (existingLog) {
        this.logger.warn(`Commission already distributed for call ${callId}, skipping`);
        return;
      }

      const result = await tx.execute<{
        id: string; user_id: string | null; astrologer_id: string;
        balance: string; total_added: string; total_deducted: string;
      }>(sql`SELECT id, user_id, astrologer_id, balance, total_added, total_deducted
        FROM wallets WHERE astrologer_id = ${astrologerId} LIMIT 1 FOR UPDATE`);
      const wallet = result.rows?.[0] ? {
        id: result.rows[0].id,
        astrologerId: result.rows[0].astrologer_id,
        balance: result.rows[0].balance,
        totalAdded: result.rows[0].total_added,
        totalDeducted: result.rows[0].total_deducted,
      } : null;

      if (!wallet) {
        this.logger.warn(`No wallet found for astrologer ${astrologerId}, skipping earnings credit`);
        return;
      }

      const amountStr = astrologerEarnings.toFixed(2);

      await tx
        .update(schema.wallets)
        .set({
          balance: sql`${schema.wallets.balance} + ${amountStr}::decimal`,
          totalAdded: sql`${schema.wallets.totalAdded} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.wallets.id, wallet.id));

      await tx.insert(schema.transactions).values({
        walletId: wallet.id,
        astrologerId: astrologerId,
        type: 'credit',
        category: 'commission',
        amount: amountStr,
        fee: '0',
        netAmount: amountStr,
        status: 'success',
        description: `Earnings from call ${callId}`,
        referenceId: callId,
      });

      await tx.insert(schema.commissionLogs).values({
        callId,
        astrologerId,
        amount: totalCost.toFixed(2),
        percentage: effectivePercentage.toFixed(2),
        totalEarned: astrologerEarnings.toFixed(2),
        platformFee: platformFee.toFixed(2),
      });

      if (platformFee > 0) {
        const adminWallet = await this.walletService.getOrCreateAdminWallet();
        const feeStr = platformFee.toFixed(2);
        await tx
          .update(schema.wallets)
          .set({
            balance: sql`${schema.wallets.balance} + ${feeStr}::decimal`,
            totalAdded: sql`${schema.wallets.totalAdded} + ${feeStr}::decimal`,
            updatedAt: new Date(),
          })
          .where(eq(schema.wallets.id, adminWallet.id));
        await tx.insert(schema.transactions).values({
          walletId: adminWallet.id,
          type: 'credit',
          category: 'commission',
          amount: feeStr,
          fee: '0',
          netAmount: feeStr,
          status: 'success',
          description: `Platform fee from call ${callId}`,
          referenceId: callId,
        });
      }

      await tx
        .update(schema.astrologers)
        .set({
          totalEarnings: sql`${schema.astrologers.totalEarnings} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.astrologers.id, astrologerId));
    });
  }

  async distributeChatEarnings(
    astrologerId: string,
    conversationId: string,
    messageId: string,
    chargeAmount: number,
  ): Promise<void> {
    const commission = await this.findByAstrologerId(astrologerId);
    const percentage = commission && commission.isActive ? parseFloat(commission.value) : 10;
    const effectivePercentage = Math.max(0, Math.min(100, percentage));
    const platformFee = (chargeAmount * effectivePercentage) / 100;
    const astrologerEarnings = chargeAmount - platformFee;

    await this.db.transaction(async (tx) => {
      const idempotent = await tx
        .select()
        .from(schema.transactions)
        .where(and(
          eq(schema.transactions.referenceId, messageId),
          eq(schema.transactions.category, 'commission'),
        ))
        .limit(1);
      if (idempotent.length > 0) {
        this.logger.warn(`Chat revenue already distributed for message ${messageId}, skipping`);
        return;
      }

      // Auto-create astrologer wallet if missing
      let wallet = (await tx.execute<{
        id: string; balance: string;
      }>(sql`SELECT id, balance FROM wallets WHERE astrologer_id = ${astrologerId} LIMIT 1 FOR UPDATE`)).rows?.[0];
      if (!wallet) {
        const [created] = await tx.insert(schema.wallets).values({
          astrologerId,
        }).returning({ id: schema.wallets.id, balance: schema.wallets.balance });
        wallet = created;
      }

      const amountStr = astrologerEarnings.toFixed(2);

      // Credit astrologer wallet
      await tx
        .update(schema.wallets)
        .set({
          balance: sql`${schema.wallets.balance} + ${amountStr}::decimal`,
          totalAdded: sql`${schema.wallets.totalAdded} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.wallets.id, wallet.id));

      // Insert transaction record for astrologer credit
      const [txn] = await tx.insert(schema.transactions).values({
        walletId: wallet.id,
        astrologerId,
        type: 'credit',
        category: 'commission',
        amount: amountStr,
        fee: platformFee.toFixed(2),
        netAmount: amountStr,
        status: 'success',
        description: `Earnings from chat in conversation ${conversationId}`,
        referenceId: messageId,
      }).returning();

      // Insert commission_log for audit trail
      await tx.insert(schema.commissionLogs).values({
        astrologerId,
        transactionId: txn.id,
        amount: chargeAmount.toFixed(2),
        percentage: effectivePercentage.toFixed(2),
        totalEarned: astrologerEarnings.toFixed(2),
        platformFee: platformFee.toFixed(2),
      });

      // Credit platform fee to admin wallet
      if (platformFee > 0) {
        const adminWallet = await this.walletService.getOrCreateAdminWallet();
        const feeStr = platformFee.toFixed(2);
        await tx
          .update(schema.wallets)
          .set({
            balance: sql`${schema.wallets.balance} + ${feeStr}::decimal`,
            totalAdded: sql`${schema.wallets.totalAdded} + ${feeStr}::decimal`,
            updatedAt: new Date(),
          })
          .where(eq(schema.wallets.id, adminWallet.id));
        await tx.insert(schema.transactions).values({
          walletId: adminWallet.id,
          type: 'credit',
          category: 'commission',
          amount: feeStr,
          fee: '0',
          netAmount: feeStr,
          status: 'success',
          description: `Platform fee from chat conversation ${conversationId}`,
          referenceId: messageId,
        });
      }
    });
  }
}
