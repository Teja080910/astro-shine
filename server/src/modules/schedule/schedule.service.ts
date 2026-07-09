import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class ScheduleService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findByAstrologer(astrologerId: string) {
    return this.db.query.astrologerSchedules.findMany({
      where: eq(schema.astrologerSchedules.astrologerId, astrologerId),
      orderBy: schema.astrologerSchedules.dayOfWeek,
    });
  }

  async upsert(astrologerId: string, dayOfWeek: number, startTime: string, endTime: string, isAvailable: boolean) {
    const existing = await this.db.query.astrologerSchedules.findFirst({
      where: and(
        eq(schema.astrologerSchedules.astrologerId, astrologerId),
        eq(schema.astrologerSchedules.dayOfWeek, dayOfWeek),
      ),
    });
    if (existing) {
      const [result] = await this.db.update(schema.astrologerSchedules)
        .set({ startTime, endTime, isAvailable, updatedAt: new Date() })
        .where(eq(schema.astrologerSchedules.id, existing.id))
        .returning();
      return result;
    }
    const [result] = await this.db.insert(schema.astrologerSchedules)
      .values({ astrologerId, dayOfWeek, startTime, endTime, isAvailable })
      .returning();
    return result;
  }

  async bulkUpsert(astrologerId: string, schedules: { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }[]) {
    const results = [];
    for (const s of schedules) {
      results.push(await this.upsert(astrologerId, s.dayOfWeek, s.startTime, s.endTime, s.isAvailable));
    }
    return results;
  }
}
