import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, sql, inArray, desc } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { WalletService } from '../wallet/wallet.service';
import { CommissionService } from '../commission/commission.service';
import { paginated, Pagination } from '../../common/utils/pagination';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
    private readonly walletService: WalletService,
    private readonly commissionService: CommissionService,
  ) {}

  private searchWhere(q?: string) {
    if (!q) return undefined;
    const pattern = `%${q}%`;
    return and(
      sql`${schema.callLogs.type}::text ILIKE ${pattern}`,
      sql`${schema.callLogs.status}::text ILIKE ${pattern}`,
    );
  }

  async findAll(pagination?: Pagination) {
    if (!pagination?.enabled) return this.db.query.callLogs.findMany();
    const conditions: any[] = [];
    if (pagination.q) {
      const pattern = `%${pagination.q}%`;
      conditions.push(sql`${schema.callLogs.type}::text ILIKE ${pattern}`);
      conditions.push(sql`${schema.callLogs.status}::text ILIKE ${pattern}`);
      conditions.push(sql`${schema.callLogs.userId}::text ILIKE ${pattern}`);
      conditions.push(sql`${schema.callLogs.astrologerId}::text ILIKE ${pattern}`);
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const build = () => this.db.select().from(schema.callLogs).where(where);
    const [data, countRows] = await Promise.all([
      build().orderBy(desc(schema.callLogs.createdAt)).limit(pagination.limit).offset(pagination.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.callLogs).where(where),
    ]);
    return paginated(data, countRows[0]?.count ?? 0, pagination);
  }

  async findById(id: string) { return this.db.query.callLogs.findFirst({ where: eq(schema.callLogs.id, id) }); }

  async findByUserId(userId: string, pagination?: Pagination) {
    if (!pagination?.enabled) return this.db.query.callLogs.findMany({ where: eq(schema.callLogs.userId, userId) });
    const conditions: any[] = [eq(schema.callLogs.userId, userId)];
    if (pagination.q) {
      const pattern = `%${pagination.q}%`;
      conditions.push(sql`${schema.callLogs.type}::text ILIKE ${pattern}`);
      conditions.push(sql`${schema.callLogs.status}::text ILIKE ${pattern}`);
      conditions.push(sql`${schema.callLogs.astrologerId}::text ILIKE ${pattern}`);
    }
    const where = and(...conditions);
    const build = () => this.db.select().from(schema.callLogs).where(where);
    const [data, countRows] = await Promise.all([
      build().orderBy(desc(schema.callLogs.createdAt)).limit(pagination.limit).offset(pagination.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.callLogs).where(where),
    ]);
    return paginated(data, countRows[0]?.count ?? 0, pagination);
  }

  async findByAstrologerId(astrologerId: string, pagination?: Pagination) {
    if (!pagination?.enabled) {
      const calls = await this.db.query.callLogs.findMany({ where: eq(schema.callLogs.astrologerId, astrologerId) });
      return this.withUserNames(calls);
    }
    const conditions: any[] = [eq(schema.callLogs.astrologerId, astrologerId)];
    const search = this.searchWhere(pagination.q);
    if (search) conditions.push(search);
    const where = and(...conditions);
    const build = () => this.db.select().from(schema.callLogs).where(where);
    const [calls, countRows] = await Promise.all([
      build().orderBy(desc(schema.callLogs.createdAt)).limit(pagination.limit).offset(pagination.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.callLogs).where(where),
    ]);
    return paginated(await this.withUserNames(calls), countRows[0]?.count ?? 0, pagination);
  }

  private async withUserNames(calls: any[]) {
    const userIds = [...new Set(calls.map(c => c.userId).filter(Boolean))];
    if (userIds.length === 0) return calls.map(c => ({ ...c, userName: 'Unknown User' }));
    const users = await this.db.query.users.findMany({ where: inArray(schema.users.id, userIds as string[]) });
    const userMap = new Map(users.map(u => [u.id, u.name]));
    return calls.map(call => ({ ...call, userName: userMap.get(call.userId) || 'Unknown User' }));
  }

  async create(data: typeof schema.callLogs.$inferInsert) {
    const [r] = await this.db.insert(schema.callLogs).values(data).returning(); return r;
  }

  async updateStatus(id: string, status: string) {
    const [r] = await this.db.update(schema.callLogs).set({ status: status as any }).where(eq(schema.callLogs.id, id)).returning(); return r;
  }

  async updateStartedAt(id: string) {
    const [r] = await this.db.update(schema.callLogs).set({ startedAt: new Date() }).where(eq(schema.callLogs.id, id)).returning(); return r;
  }

  async endCall(id: string) {
    const now = new Date();
    const call = await this.findById(id);
    if (!call) return null;
    const startedAt = call.startedAt ? new Date(call.startedAt) : now;
    const duration = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    const ratePerMin = parseFloat(call.ratePerMin || '0');
    const cost = ratePerMin > 0 ? ((duration / 60) * ratePerMin).toFixed(2) : '0';
    const [r] = await this.db.update(schema.callLogs).set({
      status: 'completed',
      endedAt: now,
      duration,
      cost,
    }).where(eq(schema.callLogs.id, id)).returning();

    const costNum = parseFloat(cost);

    // Deduct call cost from caller's wallet
    if (costNum > 0) {
      try {
        await this.walletService.deductFundsAtomic({
          userId: call.userId,
          amount: costNum,
          description: `Call with astrologer (${duration}s)`,
          category: 'call_charge',
          referenceId: call.id,
        });
      } catch (e: any) {
        this.logger.error(`[CallsService] Failed to deduct wallet for call ${id}: ${e.message}`);
        await this.db.update(schema.callLogs).set({
          status: 'failed',
          endedAt: now,
          duration,
          cost,
        }).where(eq(schema.callLogs.id, id));
        this.realtime.broadcast('call:error', { callId: id, message: 'Payment processing failed' });
        return null;
      }
    }

    // Distribute earnings: platform commission + astrologer credit
    if (costNum > 0) {
      try {
        await this.commissionService.distributeEarnings(
          call.astrologerId,
          call.id,
          costNum,
        );
      } catch (e: any) {
        this.logger.error(`[CallsService] Failed to distribute earnings for call ${id}: ${e.message}`);
      }
    }

    // Update astrologer call counters
    await this.db.update(schema.astrologers).set({
      totalCalls: sql`${schema.astrologers.totalCalls} + 1`,
      totalVideoCalls: call.type === 'video' ? sql`${schema.astrologers.totalVideoCalls} + 1` : undefined,
      totalAudioCalls: call.type === 'audio' ? sql`${schema.astrologers.totalAudioCalls} + 1` : undefined,
      updatedAt: new Date(),
    }).where(eq(schema.astrologers.userId, call.astrologerId));

    this.realtime.broadcast('astrologer:stats-updated', { astrologerId: call.astrologerId });

    return r;
  }
}
