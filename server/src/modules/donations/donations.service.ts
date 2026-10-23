import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql, desc } from 'drizzle-orm';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { paginated, Pagination } from '../../common/utils/pagination';

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly walletService: WalletService,
    private readonly notifications: NotificationsService,
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
    const searchClause = pattern
      ? sql`AND (dl.type ILIKE ${pattern} OR dl.note ILIKE ${pattern} OR COALESCE(u.name, '') ILIKE ${pattern} OR COALESCE(au.name, '') ILIKE ${pattern})`
      : sql``;

    const selectClause = sql`
      SELECT dl.id, dl.user_id, dl.admin_id, dl.type, dl.amount, dl.status,
             dl.note, dl.created_at,
             COALESCE(u.name, '') AS user_name,
             COALESCE(au.name, '') AS admin_name
      FROM donation_logs dl
      LEFT JOIN users u ON dl.user_id = u.id
      LEFT JOIN admins a ON dl.admin_id = a.user_id
      LEFT JOIN users au ON a.user_id = au.id
      WHERE 1 = 1
      ${searchClause}
      ORDER BY dl.created_at DESC
    `;

    const mapRow = (r: any) => ({
      id: r.id,
      userId: r.user_id,
      adminId: r.admin_id,
      type: r.type,
      amount: r.amount,
      status: r.status,
      note: r.note,
      createdAt: r.created_at,
      userName: r.user_name,
      adminName: r.admin_name,
    });

    if (!pagination?.enabled) {
      const rows = await this.db.execute(selectClause);
      return rows.rows.map(mapRow);
    }

    const [rows, count] = await Promise.all([
      this.db.execute(
        sql`${selectClause} LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
      ),
      this.db.execute<{ count: number }>(sql`
        SELECT COUNT(*)::int AS count
        FROM donation_logs dl
        LEFT JOIN users u ON dl.user_id = u.id
        LEFT JOIN admins a ON dl.admin_id = a.user_id
        LEFT JOIN users au ON a.user_id = au.id
        WHERE 1 = 1
        ${searchClause}
      `),
    ]);

    return paginated(
      rows.rows.map(mapRow),
      Number(count.rows[0]?.count || 0),
      pagination,
    );
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
    await this.notifyDonationReceived({
      userId: r.userId,
      donationId: r.id,
      amount: r.amount,
      note: data.message,
    });
    return r;
  }

  async createFromWallet(userId: string, amount: number, message?: string) {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException('Invalid donation amount');
    }

    const referenceId = `donation-wallet-${userId}-${Date.now()}`;
    const transactionId = await this.walletService.deductFundsAtomic({
      userId,
      amount: parsed,
      description: 'Temple Donation',
      category: 'donation',
      referenceId,
      metadata: { source: 'wallet', purpose: 'donation' },
    });

    if (!transactionId) {
      throw new BadRequestException('Donation could not be processed');
    }

    return this.create({
      userId,
      amount: parsed.toFixed(2),
      transactionId,
      message: message || 'Donation via wallet',
    });
  }

  async createReceived(data: { amount: number; userId?: string; note?: string }) {
    const [r] = await this.db.insert(schema.donationLogs).values({
      userId: data.userId || null,
      type: 'received',
      amount: data.amount.toFixed(2),
      note: data.note || null,
    }).returning();
    await this.notifyDonationReceived({
      userId: r.userId,
      amount: r.amount,
      note: data.note,
    });
    return r;
  }

  private async notifyDonationReceived(params: {
    userId?: string | null;
    donationId?: string;
    amount: string;
    note?: string | null;
  }) {
    const amountStr = Number(params.amount).toFixed(2);
    const data = {
      type: 'donation_received',
      donationId: params.donationId,
      amount: amountStr,
      status: 'received',
      screen: 'Donation',
    };

    if (params.userId) {
      this.notifications
        .create({
          userId: params.userId,
          type: 'transactional',
          title: 'Donation received 🙏',
          body: `Thank you! Your donation of ₹${amountStr} has been received.`,
          data,
        })
        .catch((e) =>
          this.logger.warn(`Donation receipt notification failed: ${e.message}`),
        );
    }

    try {
      const donor = params.userId
        ? await this.db.query.users.findFirst({
            where: eq(schema.users.id, params.userId),
            columns: { name: true },
          })
        : null;
      await this.notifications.notifyAdmins({
        type: 'transactional',
        title: 'Donation received',
        body: `${donor?.name || 'A devotee'} donated ₹${amountStr}.${params.note ? ` Note: ${params.note}` : ''}`,
        data,
      });
    } catch (e: any) {
      this.logger.warn(`Donation admin notification failed: ${e.message}`);
    }
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

    try {
      await this.notifications.notifyAdmins({
        type: 'transactional',
        title: 'Donation withdrawal processed',
        body: `₹${amountStr} was withdrawn from the donation fund.${data.note ? ` Note: ${data.note}` : ''}`,
        data: {
          type: 'donation_withdrawn',
          amount: amountStr,
          status: 'processed',
          note: data.note || undefined,
        },
      });
    } catch (e: any) {
      this.logger.warn(`Donation withdrawal notification failed: ${e.message}`);
    }
  }
}
