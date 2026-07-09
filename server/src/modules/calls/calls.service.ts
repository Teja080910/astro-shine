import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class CallsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.callLogs.findMany(); }
  async findById(id: string) { return this.db.query.callLogs.findFirst({ where: eq(schema.callLogs.id, id) }); }
  async findByUserId(userId: string) { return this.db.query.callLogs.findMany({ where: eq(schema.callLogs.userId, userId) }); }

  async findByAstrologerId(astrologerId: string) {
    const calls = await this.db.query.callLogs.findMany({ where: eq(schema.callLogs.astrologerId, astrologerId) });
    const enriched = await Promise.all(calls.map(async (call) => {
      const user = await this.db.query.users.findFirst({ where: eq(schema.users.id, call.userId) });
      return { ...call, userName: user?.name || 'Unknown User' };
    }));
    return enriched;
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

    // Update astrologer total calls and earnings
    await this.db.update(schema.astrologers).set({
      totalCalls: sql`${schema.astrologers.totalCalls} + 1`,
      totalEarnings: sql`${schema.astrologers.totalEarnings} + ${cost}::decimal`,
      updatedAt: new Date(),
    }).where(eq(schema.astrologers.id, call.astrologerId));

    return r;
  }
}
