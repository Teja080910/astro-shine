import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql, desc } from 'drizzle-orm';
import { WalletService } from '../wallet/wallet.service';
import { RealtimeService } from '../../common/realtime.service';
import { PayoutService } from '../payout/payout.service';
import { paginated, Pagination } from '../../common/utils/pagination';

type WithdrawalRow = {
  id: string;
  astrologer_id: string;
  admin_id: string;
  astrologer_name: string;
  admin_name: string;
  amount: string;
  status: string;
  bank_account: any;
  admin_note: string;
  payout_id: string;
  payout_utr: string;
  payout_status: string;
  payout_response: any;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly walletService: WalletService,
    private readonly realtime: RealtimeService,
    private readonly payoutService: PayoutService,
  ) {}

  async findByAstrologerId(astrologerId: string) {
    return this.db.query.withdrawalRequests.findMany({
      where: eq(schema.withdrawalRequests.astrologerId, astrologerId),
    });
  }
  async findByAdminId(adminId: string) {
    return this.db.query.withdrawalRequests.findMany({
      where: eq(schema.withdrawalRequests.adminId, adminId),
    });
  }

  async findAll(pagination?: Pagination) {
    const pattern = pagination?.q ? `%${pagination.q}%` : undefined;
    const searchClause = pattern
      ? sql`WHERE (COALESCE(u_astro.name, '') ILIKE ${pattern} OR COALESCE(u_admin.name, '') ILIKE ${pattern} OR wr.status::text ILIKE ${pattern})`
      : sql``;

    const selectClause = sql`
      SELECT wr.id, wr.astrologer_id, wr.admin_id, wr.amount, wr.status,
             wr.bank_account, wr.admin_note, wr.created_at, wr.updated_at,
             wr.payout_id, wr.payout_utr, wr.payout_status, wr.payout_response,
             COALESCE(u_astro.name, '') AS astrologer_name,
             COALESCE(u_admin.name, '') AS admin_name
      FROM withdrawal_requests wr
      LEFT JOIN astrologers a ON wr.astrologer_id = a.user_id
      LEFT JOIN users u_astro ON a.user_id = u_astro.id
      LEFT JOIN admins ad ON wr.admin_id = ad.user_id
      LEFT JOIN users u_admin ON ad.user_id = u_admin.id
      ${searchClause}
      ORDER BY wr.created_at DESC
    `;

    const mapRow = (r: WithdrawalRow) => ({
      id: r.id,
      astrologerId: r.astrologer_id,
      adminId: r.admin_id,
      astrologerName: r.astrologer_name,
      adminName: r.admin_name,
      amount: r.amount,
      status: r.status,
      bankAccount: r.bank_account,
      adminNote: r.admin_note,
      payoutId: r.payout_id,
      payoutUtr: r.payout_utr,
      payoutStatus: r.payout_status,
      payoutResponse: r.payout_response,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });

    if (!pagination?.enabled) {
      const rows = await this.db.execute<WithdrawalRow>(selectClause);
      return rows.rows.map(mapRow);
    }

    const [rows, count] = await Promise.all([
      this.db.execute<WithdrawalRow>(
        sql`${selectClause} LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
      ),
      this.db.execute<{ count: number }>(sql`
        SELECT COUNT(*)::int AS count
        FROM withdrawal_requests wr
        LEFT JOIN astrologers a ON wr.astrologer_id = a.user_id
        LEFT JOIN users u_astro ON a.user_id = u_astro.id
        LEFT JOIN admins ad ON wr.admin_id = ad.user_id
        LEFT JOIN users u_admin ON ad.user_id = u_admin.id
        ${searchClause}
      `),
    ]);

    return paginated(rows.rows.map(mapRow), Number(count.rows[0].count), pagination);
  }

  async findAstrologerSummaries() {
    const [astrologers, withdrawals] = await Promise.all([
      this.db
        .select({
          astrologerId: schema.astrologers.userId,
          name: schema.users.name,
          email: schema.users.email,
          phone: schema.users.phone,
          avatar: schema.users.avatar,
          verificationStatus: schema.astrologers.verificationStatus,
          totalEarnings: schema.astrologers.totalEarnings,
          availableBalance: sql<string>`COALESCE(${schema.wallets.balance}, '0')`,
        })
        .from(schema.astrologers)
        .leftJoin(schema.users, eq(schema.astrologers.userId, schema.users.id))
        .leftJoin(
          schema.wallets,
          eq(schema.wallets.astrologerId, schema.astrologers.userId),
        ),
      this.db
        .select({
          astrologerId: schema.withdrawalRequests.astrologerId,
          amount: schema.withdrawalRequests.amount,
          status: schema.withdrawalRequests.status,
          createdAt: schema.withdrawalRequests.createdAt,
        })
        .from(schema.withdrawalRequests),
    ]);

    const stats = new Map<
      string,
      {
        totalWithdrawn: number;
        pendingAmount: number;
        withdrawalCount: number;
        lastWithdrawalAt: string | null;
      }
    >();

    for (const w of withdrawals) {
      if (!w.astrologerId) continue;
      const current = stats.get(w.astrologerId) || {
        totalWithdrawn: 0,
        pendingAmount: 0,
        withdrawalCount: 0,
        lastWithdrawalAt: null,
      };
      const amount = Number(w.amount) || 0;
      current.withdrawalCount += 1;
      if (w.status === 'approved' || w.status === 'completed') {
        current.totalWithdrawn += amount;
      }
      if (w.status === 'pending') {
        current.pendingAmount += amount;
      }
      const createdAt = w.createdAt
        ? new Date(w.createdAt).toISOString()
        : null;
      if (
        createdAt &&
        (!current.lastWithdrawalAt || createdAt > current.lastWithdrawalAt)
      ) {
        current.lastWithdrawalAt = createdAt;
      }
      stats.set(w.astrologerId, current);
    }

    return astrologers.map((a) => {
      const s = stats.get(a.astrologerId);
      return {
        ...a,
        totalEarnings: Number(a.totalEarnings) || 0,
        availableBalance: Number(a.availableBalance) || 0,
        totalWithdrawn: s?.totalWithdrawn || 0,
        pendingAmount: s?.pendingAmount || 0,
        withdrawalCount: s?.withdrawalCount || 0,
        lastWithdrawalAt: s?.lastWithdrawalAt || null,
      };
    });
  }

  async findAstrologerDetail(astrologerId: string) {
    const [astrologer] = await this.db
      .select({
        astrologerId: schema.astrologers.userId,
        name: schema.users.name,
        email: schema.users.email,
        phone: schema.users.phone,
        avatar: schema.users.avatar,
        verificationStatus: schema.astrologers.verificationStatus,
        totalEarnings: schema.astrologers.totalEarnings,
        availableBalance: sql<string>`COALESCE(${schema.wallets.balance}, '0')`,
      })
      .from(schema.astrologers)
      .leftJoin(schema.users, eq(schema.astrologers.userId, schema.users.id))
      .leftJoin(
        schema.wallets,
        eq(schema.wallets.astrologerId, schema.astrologers.userId),
      )
      .where(eq(schema.astrologers.userId, astrologerId))
      .limit(1);

    if (!astrologer) throw new NotFoundException('Astrologer not found');

    const withdrawals = await this.db.query.withdrawalRequests.findMany({
      where: eq(schema.withdrawalRequests.astrologerId, astrologerId),
      orderBy: [desc(schema.withdrawalRequests.createdAt)],
    });

    const totalWithdrawn = withdrawals
      .filter((w) => w.status === 'approved' || w.status === 'completed')
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
    const pendingAmount = withdrawals
      .filter((w) => w.status === 'pending')
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    return {
      ...astrologer,
      totalEarnings: Number(astrologer.totalEarnings) || 0,
      availableBalance: Number(astrologer.availableBalance) || 0,
      totalWithdrawn,
      pendingAmount,
      withdrawalCount: withdrawals.length,
      withdrawals,
    };
  }

  async create(data: typeof schema.withdrawalRequests.$inferInsert) {
    const amount = parseFloat(data.amount);
    if (data.astrologerId) {
      const wallet = await this.walletService.getWalletByAstrologerId(
        data.astrologerId,
      );
      if (!wallet || Number(wallet.balance) < amount) {
        throw new BadRequestException(
          'Insufficient wallet balance for withdrawal',
        );
      }
    }
    const [r] = await this.db
      .insert(schema.withdrawalRequests)
      .values(data)
      .returning();
    this.realtime.broadcast('withdrawal:new', r);
    return r;
  }

  async createAdminWithdrawal(adminId: string, amountInput: number | string) {
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid withdrawal amount');
    }

    const wallet = await this.walletService.getOrCreateAdminWalletFor(adminId);
    if (Number(wallet.balance) < amount)
      throw new BadRequestException('Insufficient wallet balance');

    const amountStr = amount.toFixed(2);

    return this.db.transaction(async (tx) => {
      const wResult = await tx.execute<{ id: string; balance: string }>(
        sql`SELECT id, balance FROM wallets WHERE admin_id = ${adminId} LIMIT 1 FOR UPDATE`,
      );
      const w = wResult.rows?.[0];
      if (!w || Number(w.balance) < amount)
        throw new BadRequestException('Insufficient wallet balance');

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

      const [wr] = await tx
        .insert(schema.withdrawalRequests)
        .values({
          adminId,
          amount: amountStr,
          status: 'approved',
          processedBy: adminId,
          processedAt: new Date(),
        })
        .returning();
      this.realtime.broadcast('withdrawal:new', wr);
      return wr;
    });
  }

  async approve(id: string, adminId: string) {
    const request = await this.db.query.withdrawalRequests.findFirst({
      where: eq(schema.withdrawalRequests.id, id),
    });
    if (!request) throw new BadRequestException('Withdrawal request not found');
    if (request.status !== 'pending')
      throw new BadRequestException('Withdrawal request is not pending');
    if (!request.astrologerId)
      throw new BadRequestException(
        'Only astrologer withdrawals can be approved',
      );

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
        id: string;
        user_id: string | null;
        astrologer_id: string;
        balance: string;
        total_added: string;
        total_deducted: string;
      }>(sql`SELECT id, user_id, astrologer_id, balance, total_added, total_deducted
        FROM wallets WHERE astrologer_id = ${request.astrologerId} LIMIT 1 FOR UPDATE`);
      const wallet = result.rows?.[0]
        ? {
            id: result.rows[0].id,
            astrologerId: result.rows[0].astrologer_id,
            balance: result.rows[0].balance,
            totalAdded: result.rows[0].total_added,
            totalDeducted: result.rows[0].total_deducted,
          }
        : null;

      if (!wallet) throw new BadRequestException('Astrologer wallet not found');
      if (Number(wallet.balance) < amount)
        throw new BadRequestException('Insufficient wallet balance');

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

    // Initiate RazorpayX payout to astrologer's bank account
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(schema.users.id, request.astrologerId!),
      });

      const payout = await this.payoutService.createPayout({
        astrologerId: request.astrologerId!,
        astrologerName: user?.name || 'Astrologer',
        email: user?.email || undefined,
        phone: user?.phone || undefined,
        bank: request.bankAccount as any,
        amount,
        referenceId: request.id,
      });

      await this.db
        .update(schema.withdrawalRequests)
        .set({
          payoutId: payout.payoutId,
          payoutStatus: payout.payoutStatus,
          payoutUtr: payout.utr || null,
          payoutResponse: payout.response as any,
          updatedAt: new Date(),
        })
        .where(eq(schema.withdrawalRequests.id, id));

      if (payout.payoutStatus === 'processed') {
        await this.db
          .update(schema.withdrawalRequests)
          .set({
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(schema.withdrawalRequests.id, id));
      }
    } catch (e: any) {
      this.logger.error(
        `[Withdrawal] Payout initiation failed for ${id}: ${e.message}`,
      );
      await this.db
        .update(schema.withdrawalRequests)
        .set({
          payoutStatus: 'failed',
          payoutResponse: { error: e.message } as any,
          updatedAt: new Date(),
        })
        .where(eq(schema.withdrawalRequests.id, id));
    }

    this.realtime.broadcast('withdrawal:updated', { id, status: 'approved' });
  }

  async reject(id: string, adminId: string, note?: string) {
    const [r] = await this.db
      .update(schema.withdrawalRequests)
      .set({
        status: 'rejected',
        processedBy: adminId,
        processedAt: new Date(),
        adminNote: note,
        updatedAt: new Date(),
      })
      .where(eq(schema.withdrawalRequests.id, id))
      .returning();
    this.realtime.broadcast('withdrawal:updated', { id, status: 'rejected' });
    return r;
  }
}
