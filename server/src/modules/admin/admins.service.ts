import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql, desc, or, and, isNull } from 'drizzle-orm';

@Injectable()
export class AdminsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.admins.findMany(); }
  async findById(id: string) { return this.db.query.admins.findFirst({ where: eq(schema.admins.id, id) }); }
  async findByEmail(email: string) { return this.db.query.admins.findFirst({ where: eq(schema.admins.email, email) }); }

  async create(data: typeof schema.admins.$inferInsert) {
    const [r] = await this.db.insert(schema.admins).values(data).returning(); return r;
  }

  async update(id: string, data: Partial<typeof schema.admins.$inferInsert>) {
    const [r] = await this.db.update(schema.admins)
      .set({ ...data, updatedAt: new Date() }).where(eq(schema.admins.id, id)).returning();
    return r;
  }

  async getDashboardStats() {
    const [usersCountResult] = await this.db.select({ count: sql<number>`count(*)` })
      .from(schema.users)
      .where(isNull(schema.users.deletedAt));
    
    const [astrologersCountResult] = await this.db.select({ count: sql<number>`count(*)` })
      .from(schema.astrologers)
      .where(isNull(schema.astrologers.deletedAt));

    const [revenueResult] = await this.db.select({ sum: sql<string>`sum(amount)` })
      .from(schema.transactions)
      .where(and(eq(schema.transactions.category, 'add_funds'), eq(schema.transactions.status, 'success')));

    const [activeCallsResult] = await this.db.select({ count: sql<number>`count(*)` })
      .from(schema.callLogs)
      .where(or(eq(schema.callLogs.status, 'ongoing'), eq(schema.callLogs.status, 'initiated')));

    const recentTransactions = await this.db.query.transactions.findMany({
      limit: 5,
      orderBy: desc(schema.transactions.createdAt),
    });

    const pendingWithdrawals = await this.db.query.withdrawalRequests.findMany({
      where: eq(schema.withdrawalRequests.status, 'pending'),
      limit: 5,
      orderBy: desc(schema.withdrawalRequests.createdAt),
    });

    const pendingAstrologers = await this.db.query.astrologers.findMany({
      where: eq(schema.astrologers.verificationStatus, 'pending'),
      limit: 5,
      orderBy: desc(schema.astrologers.createdAt),
    });

    return {
      totalUsers: Number(usersCountResult?.count || 0),
      totalAstrologers: Number(astrologersCountResult?.count || 0),
      totalRevenue: Number(revenueResult?.sum || 0),
      activeCalls: Number(activeCallsResult?.count || 0),
      recentTransactions,
      pendingWithdrawals,
      pendingAstrologers,
    };
  }
}

