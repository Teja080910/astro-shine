import { Injectable, Inject, BadRequestException } from '@nestjs/common';
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

  private validateSlot(dayOfWeek: number, startTime: string, endTime: string) {
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new BadRequestException('dayOfWeek must be between 0 and 6');
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
      throw new BadRequestException('Times must use HH:mm format');
    }
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }
  }

  async upsert(astrologerId: string, dayOfWeek: number, startTime: string, endTime: string, isAvailable: boolean) {
    this.validateSlot(dayOfWeek, startTime, endTime);
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
    if (!Array.isArray(schedules) || schedules.length === 0) {
      throw new BadRequestException('schedules must be a non-empty array');
    }
    // Validate everything up front so a bad slot cannot leave the week half-written.
    const seen = new Set<number>();
    for (const s of schedules) {
      this.validateSlot(s.dayOfWeek, s.startTime, s.endTime);
      if (seen.has(s.dayOfWeek)) {
        throw new BadRequestException(`Duplicate schedule for day ${s.dayOfWeek}`);
      }
      seen.add(s.dayOfWeek);
    }

    return this.db.transaction(async (tx) => {
      const results = [];
      for (const s of schedules) {
        const existing = await tx.query.astrologerSchedules.findFirst({
          where: and(
            eq(schema.astrologerSchedules.astrologerId, astrologerId),
            eq(schema.astrologerSchedules.dayOfWeek, s.dayOfWeek),
          ),
        });
        if (existing) {
          const [updated] = await tx.update(schema.astrologerSchedules)
            .set({
              startTime: s.startTime,
              endTime: s.endTime,
              isAvailable: s.isAvailable ?? true,
              updatedAt: new Date(),
            })
            .where(eq(schema.astrologerSchedules.id, existing.id))
            .returning();
          results.push(updated);
        } else {
          const [created] = await tx.insert(schema.astrologerSchedules)
            .values({
              astrologerId,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              isAvailable: s.isAvailable ?? true,
            })
            .returning();
          results.push(created);
        }
      }
      return results;
    });
  }
}
