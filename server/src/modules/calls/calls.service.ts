import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql, inArray } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { WalletService } from '../wallet/wallet.service';
import { CommissionService } from '../commission/commission.service';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
    private readonly walletService: WalletService,
    private readonly commissionService: CommissionService,
  ) {}

  async findAll() { return this.db.query.callLogs.findMany(); }
  async findById(id: string) { return this.db.query.callLogs.findFirst({ where: eq(schema.callLogs.id, id) }); }
  async findByUserId(userId: string) { return this.db.query.callLogs.findMany({ where: eq(schema.callLogs.userId, userId) }); }

  async findByAstrologerId(astrologerId: string) {
    const calls = await this.db.query.callLogs.findMany({ where: eq(schema.callLogs.astrologerId, astrologerId) });
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
    }).where(eq(schema.astrologers.id, call.astrologerId));

    this.realtime.broadcast('astrologer:stats-updated', { astrologerId: call.astrologerId });

    return r;
  }
}
