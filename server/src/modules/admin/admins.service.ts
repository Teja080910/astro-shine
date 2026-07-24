import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql, desc, or, and, isNull, inArray } from 'drizzle-orm';

@Injectable()
export class AdminsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() {
    return this.db.query.admins.findMany();
  }

  async findByUserId(userId: string) {
    return this.db.query.admins.findFirst({ where: eq(schema.admins.userId, userId) });
  }

  async findById(id: string) {
    return this.findByUserId(id);
  }

  async create(data: typeof schema.admins.$inferInsert) {
    const [r] = await this.db.insert(schema.admins).values(data).returning();
    return r;
  }

  async update(id: string, data: Partial<typeof schema.admins.$inferInsert>) {
    const [r] = await this.db.update(schema.admins)
      .set({ ...data, updatedAt: new Date() }).where(eq(schema.admins.userId, id)).returning();
    return r;
  }

  async getDashboardStats() {
    const [usersCountResult] = await this.db.select({ count: sql<number>`count(*)` })
      .from(schema.users)
      .where(isNull(schema.users.deletedAt));

    const [astrologersCountResult] = await this.db.select({ count: sql<number>`count(*)` })
      .from(schema.astrologers);

    const [depositsResult] = await this.db.select({ sum: sql<string>`sum(amount)` })
      .from(schema.transactions)
      .where(and(eq(schema.transactions.category, 'add_funds'), eq(schema.transactions.status, 'success')));

    const [platformFeesResult] = await this.db.select({ sum: sql<string>`sum(platform_fee)` })
      .from(schema.commissionLogs);

    const [processedWithdrawalsResult] = await this.db.select({ sum: sql<string>`sum(amount)` })
      .from(schema.withdrawalRequests)
      .where(eq(schema.withdrawalRequests.status, 'approved'));

    const [pendingWithdrawalsAggResult] = await this.db.select({
      count: sql<number>`count(*)`,
      sum: sql<string>`coalesce(sum(amount), '0')`,
    })
      .from(schema.withdrawalRequests)
      .where(eq(schema.withdrawalRequests.status, 'pending'));

    const [activeCallsResult] = await this.db.select({ count: sql<number>`count(*)` })
      .from(schema.callLogs)
      .where(or(eq(schema.callLogs.status, 'ongoing'), eq(schema.callLogs.status, 'initiated')));

    const recentTransactions = await this.db.query.transactions.findMany({
      limit: 10,
      orderBy: desc(schema.transactions.createdAt),
    });

    const pendingWithdrawals = await this.db.select({
      id: schema.withdrawalRequests.id,
      astrologerId: schema.withdrawalRequests.astrologerId,
      astrologerName: schema.users.name,
      amount: schema.withdrawalRequests.amount,
      status: schema.withdrawalRequests.status,
      createdAt: schema.withdrawalRequests.createdAt,
    })
    .from(schema.withdrawalRequests)
    .leftJoin(schema.astrologers, eq(schema.withdrawalRequests.astrologerId, schema.astrologers.userId))
    .leftJoin(schema.users, eq(schema.astrologers.userId, schema.users.id))
    .where(eq(schema.withdrawalRequests.status, 'pending'))
    .limit(5)
    .orderBy(desc(schema.withdrawalRequests.createdAt));

    const pendingAstrologers = await this.db.query.astrologers.findMany({
      where: eq(schema.astrologers.verificationStatus, 'pending'),
      limit: 5,
      orderBy: desc(schema.astrologers.createdAt),
    });

    return {
      totalUsers: Number(usersCountResult?.count || 0),
      totalAstrologers: Number(astrologersCountResult?.count || 0),
      totalDeposits: Number(depositsResult?.sum || 0),
      platformRevenue: Number(platformFeesResult?.sum || 0),
      processedWithdrawals: Number(processedWithdrawalsResult?.sum || 0),
      pendingWithdrawalsCount: Number(pendingWithdrawalsAggResult?.count || 0),
      pendingWithdrawalsAmount: Number(pendingWithdrawalsAggResult?.sum || 0),
      activeCalls: Number(activeCallsResult?.count || 0),
      recentTransactions,
      pendingWithdrawals,
      pendingAstrologers,
    };
  }

  async getRevenueChart(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    let trunc: string;
    switch (period) {
      case 'weekly': trunc = 'week'; break;
      case 'monthly': trunc = 'month'; break;
      default: trunc = 'day';
    }

    const deposits = await this.db.execute<{ period: string; amount: string }>(sql`
      SELECT date_trunc(${trunc}, created_at) AS period, SUM(amount) AS amount
      FROM transactions
      WHERE category = 'add_funds' AND status = 'success' AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY period ORDER BY period
    `);

    const fees = await this.db.execute<{ period: string; amount: string }>(sql`
      SELECT date_trunc(${trunc}, created_at) AS period, SUM(platform_fee) AS amount
      FROM commission_logs
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY period ORDER BY period
    `);

    return {
      deposits: deposits.rows.map(r => ({ period: r.period, amount: Number(r.amount).toFixed(2) })),
      platformFees: fees.rows.map(r => ({ period: r.period, amount: Number(r.amount).toFixed(2) })),
    };
  }

  async getRevenueTransactions(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const revenueCategories: any[] = ['add_funds', 'call_charge', 'chat_charge', 'commission'];
    const whereClause = inArray(schema.transactions.category, revenueCategories);

    const [data, totalResult] = await Promise.all([
      this.db.select().from(schema.transactions).where(whereClause)
        .orderBy(desc(schema.transactions.createdAt)).limit(limit).offset(offset),
      this.db.select({ count: sql<number>`count(*)` }).from(schema.transactions).where(whereClause),
    ]);
    return { data, total: Number(totalResult[0].count), page, limit };
  }

  async getRevenueSummary() {
    const [deposits] = await this.db.select({ sum: sql<string>`COALESCE(SUM(amount::decimal), 0)` })
      .from(schema.transactions)
      .where(and(eq(schema.transactions.category, 'add_funds'), eq(schema.transactions.status, 'success')));

    const [callCharges] = await this.db.select({ sum: sql<string>`COALESCE(SUM(amount::decimal), 0)` })
      .from(schema.transactions).where(eq(schema.transactions.category, 'call_charge'));

    const [chatCharges] = await this.db.select({ sum: sql<string>`COALESCE(SUM(amount::decimal), 0)` })
      .from(schema.transactions).where(eq(schema.transactions.category, 'chat_charge'));

    const [commissionsPaid] = await this.db.select({ sum: sql<string>`COALESCE(SUM(amount::decimal), 0)` })
      .from(schema.transactions).where(and(eq(schema.transactions.category, 'commission'), eq(schema.transactions.type, 'credit')));

    const [platformFees] = await this.db.select({ sum: sql<string>`COALESCE(SUM(platform_fee::decimal), 0)` })
      .from(schema.commissionLogs);

    return {
      totalDeposits: Number(deposits.sum),
      totalCallCharges: Number(callCharges.sum),
      totalChatCharges: Number(chatCharges.sum),
      totalPlatformFees: Number(platformFees.sum),
      totalCommissionsPaid: Number(commissionsPaid.sum),
      netRevenue: Number(platformFees.sum) - Number(commissionsPaid.sum),
    };
  }
}
