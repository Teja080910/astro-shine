import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql, desc } from 'drizzle-orm';
import { WalletService } from '../wallet/wallet.service';
import { RealtimeService } from '../../common/realtime.service';

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly walletService: WalletService,
    private readonly realtime: RealtimeService,
  ) {}

  async findByAstrologerId(astrologerId: string) { return this.db.query.withdrawalRequests.findMany({ where: eq(schema.withdrawalRequests.astrologerId, astrologerId) }); }
  async findByAdminId(adminId: string) { return this.db.query.withdrawalRequests.findMany({ where: eq(schema.withdrawalRequests.adminId, adminId) }); }

  async findAll() {
    const rows = await this.db.execute<{
      id: string; astrologer_id: string; admin_id: string; astrologer_name: string; admin_name: string;
      amount: string; status: string; bank_account: any; admin_note: string;
      created_at: string; updated_at: string;
    }>(sql`
      SELECT wr.id, wr.astrologer_id, wr.admin_id, wr.amount, wr.status,
             wr.bank_account, wr.admin_note, wr.created_at, wr.updated_at,
             COALESCE(u_astro.name, '') AS astrologer_name,
             COALESCE(u_admin.name, '') AS admin_name
      FROM withdrawal_requests wr
      LEFT JOIN astrologers a ON wr.astrologer_id = a.user_id
      LEFT JOIN users u_astro ON a.user_id = u_astro.id
      LEFT JOIN admins ad ON wr.admin_id = ad.user_id
      LEFT JOIN users u_admin ON ad.user_id = u_admin.id
      ORDER BY wr.created_at DESC
    `);
    return rows.rows.map(r => ({
      id: r.id,
      astrologerId: r.astrologer_id,
      adminId: r.admin_id,
      astrologerName: r.astrologer_name,
      adminName: r.admin_name,
      amount: r.amount,
      status: r.status,
      bankAccount: r.bank_account,
      adminNote: r.admin_note,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async create(data: typeof schema.withdrawalRequests.$inferInsert) {
    const amount = parseFloat(data.amount);
    if (data.astrologerId) {
      const wallet = await this.walletService.getWalletByAstrologerId(data.astrologerId);
      if (!wallet || Number(wallet.balance) < amount) {
        throw new BadRequestException('Insufficient wallet balance for withdrawal');
      }
    }
    const [r] = await this.db.insert(schema.withdrawalRequests).values(data).returning();
    this.realtime.broadcast('withdrawal:new', r);
    return r;
  }

  async createAdminWithdrawal(adminId: string, amount: number) {
    const wallet = await this.walletService.getWalletByAdminId(adminId);
    if (!wallet) throw new BadRequestException('Admin wallet not found');
    if (Number(wallet.balance) < amount) throw new BadRequestException('Insufficient wallet balance');

    const amountStr = amount.toFixed(2);

    await this.db.transaction(async (tx) => {
      const wResult = await tx.execute<{ id: string; balance: string }>(
        sql`SELECT id, balance FROM wallets WHERE admin_id = ${adminId} LIMIT 1 FOR UPDATE`,
      );
      const w = wResult.rows?.[0];
      if (!w || Number(w.balance) < amount) throw new BadRequestException('Insufficient wallet balance');

      await tx
        .update(schema.wallets)
        .set({
          balance: sql`${schema.wallets.balance} - ${amountStr}::decimal`,
          totalDeducted: sql`${schema.wallets.totalDeducted} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.wallets.id, w.id));

      await tx.insert(schema.transactions).values({
        walletId: w.id,
        type: 'debit',
        category: 'withdrawal',
        amount: amountStr,
        fee: '0',
        netAmount: amountStr,
        status: 'success',
        description: 'Admin withdrawal',
      });

      const [wr] = await tx.insert(schema.withdrawalRequests).values({
        adminId,
        amount: amountStr,
        status: 'approved',
        processedBy: adminId,
        processedAt: new Date(),
      }).returning();
      this.realtime.broadcast('withdrawal:new', wr);
    });
  }

  async approve(id: string, adminId: string) {
    const request = await this.db.query.withdrawalRequests.findFirst({ where: eq(schema.withdrawalRequests.id, id) });
    if (!request) throw new BadRequestException('Withdrawal request not found');
    if (request.status !== 'pending') throw new BadRequestException('Withdrawal request is not pending');
    if (!request.astrologerId) throw new BadRequestException('Only astrologer withdrawals can be approved');

    const amount = parseFloat(request.amount);

    await this.db.transaction(async (tx) => {
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

      await tx.insert(schema.transactions).values({
        walletId: wallet.id,
        astrologerId: request.astrologerId,
        type: 'debit',
        category: 'withdrawal',
        amount: amountStr,
        fee: '0',
        netAmount: amountStr,
        status: 'success',
        description: 'Withdrawal approved by admin',
      });

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
    this.realtime.broadcast('withdrawal:updated', { id, status: 'approved' });
  }

  async reject(id: string, adminId: string, note?: string) {
    const [r] = await this.db.update(schema.withdrawalRequests)
      .set({ status: 'rejected', processedBy: adminId, processedAt: new Date(), adminNote: note, updatedAt: new Date() })
      .where(eq(schema.withdrawalRequests.id, id)).returning();
    this.realtime.broadcast('withdrawal:updated', { id, status: 'rejected' });
    return r;
  }
}