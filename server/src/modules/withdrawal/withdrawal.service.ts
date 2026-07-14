import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql } from 'drizzle-orm';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly walletService: WalletService,
  ) {}

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
    const amount = parseFloat(data.amount);
    const wallet = await this.walletService.getWalletByAstrologerId(data.astrologerId);
    if (!wallet || Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient wallet balance for withdrawal');
    }
    const [r] = await this.db.insert(schema.withdrawalRequests).values(data).returning(); return r;
  }

  async approve(id: string, adminId: string) {
    const request = await this.db.query.withdrawalRequests.findFirst({ where: eq(schema.withdrawalRequests.id, id) });
    if (!request) throw new BadRequestException('Withdrawal request not found');
    if (request.status !== 'pending') throw new BadRequestException('Withdrawal request is not pending');

    const amount = parseFloat(request.amount);

    await this.db.transaction(async (tx) => {
      // Re-check request status inside transaction with FOR UPDATE
      const reqResult = await tx.execute<{ id: string; status: string }>(
        sql`SELECT id, status FROM withdrawal_requests WHERE id = ${id} FOR UPDATE`,
      );
      const reqLock = reqResult.rows?.[0];
      if (!reqLock || reqLock.status !== 'pending') {
        throw new BadRequestException('Withdrawal request is not pending');
      }

      const result = await tx.execute<{
        id: string; user_id: string | null; astrologer_id: string;
        balance: string; total_added: string; total_deducted: string;
      }>(sql`SELECT id, user_id, astrologer_id, balance, total_added, total_deducted
        FROM wallets WHERE astrologer_id = ${request.astrologerId} LIMIT 1 FOR UPDATE`);
      const wallet = result.rows?.[0] ? {
        id: result.rows[0].id,
        astrologerId: result.rows[0].astrologer_id,
        balance: result.rows[0].balance,
        totalAdded: result.rows[0].total_added,
        totalDeducted: result.rows[0].total_deducted,
      } : null;

      if (!wallet) throw new BadRequestException('Astrologer wallet not found');
      if (Number(wallet.balance) < amount) throw new BadRequestException('Insufficient wallet balance');

      const amountStr = amount.toFixed(2);

      await tx
        .update(schema.wallets)
        .set({
          balance: sql`${schema.wallets.balance} - ${amountStr}::decimal`,
          totalDeducted: sql`${schema.wallets.totalDeducted} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.wallets.id, wallet.id));

      const [transaction] = await tx.insert(schema.transactions).values({
        walletId: wallet.id,
        astrologerId: request.astrologerId,
        type: 'debit',
        category: 'withdrawal',
        amount: amountStr,
        fee: '0',
        netAmount: amountStr,
        status: 'success',
        description: 'Withdrawal approved by admin',
      }).returning();

      await tx
        .update(schema.withdrawalRequests)
        .set({
          status: 'approved',
          processedBy: adminId,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.withdrawalRequests.id, id));
    });
  }

  async reject(id: string, adminId: string, note?: string) {
    const [r] = await this.db.update(schema.withdrawalRequests)
      .set({ status: 'rejected', processedBy: adminId, processedAt: new Date(), adminNote: note, updatedAt: new Date() })
      .where(eq(schema.withdrawalRequests.id, id)).returning(); return r;
  }
}
