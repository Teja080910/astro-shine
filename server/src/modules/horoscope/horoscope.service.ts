import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, ilike, desc } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { AstrologyService } from '../astrology/astrology.service';

@Injectable()
export class HoroscopeService {
  private readonly logger = new Logger(HoroscopeService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
    private readonly astrology: AstrologyService,
  ) {}

  async findAll() {
    return this.db.query.horoscopeRecords.findMany();
  }
  async findBySign(sign: string) {
    return this.db.query.horoscopeRecords.findMany({
      where: ilike(schema.horoscopeRecords.zodiacSign, sign),
    });
  }
  async findBySignPeriod(
    sign: string,
    period: 'weekly' | 'monthly',
  ) {
    try {
      const result = await this.astrology.calculateHoroscope(sign, '', period);
      return {
        id: null,
        zodiacSign: sign,
        date: null,
        period,
        ...result,
        createdAt: new Date(),
      };
    } catch (e: any) {
      this.logger.error(
        `Horoscope ${period} fetch failed for ${sign}: ${e.message}`,
      );
      return {
        id: null,
        zodiacSign: sign,
        date: null,
        period,
        prediction:
          'Horoscope is temporarily unavailable. Please try again later.',
        lovePrediction: null,
        careerPrediction: null,
        financePrediction: null,
        healthPrediction: null,
        luckyNumber: null,
        luckyColor: null,
        mood: null,
        createdAt: new Date(),
      };
    }
  }

  async findBySignAndDate(sign: string, date: string) {
    const existing = await this.db.query.horoscopeRecords.findFirst({
      where: and(
        ilike(schema.horoscopeRecords.zodiacSign, sign),
        eq(schema.horoscopeRecords.date, date),
      ),
    });
    if (existing) {
      const backfilled = await this.backfillCategories(existing, sign, date);
      if (backfilled) return backfilled;
      return existing;
    }
    try {
      const result = await this.astrology.calculateHoroscope(sign, date);
      const [r] = await this.db
        .insert(schema.horoscopeRecords)
        .values({
          zodiacSign: sign,
          date,
          prediction: result.prediction,
          lovePrediction: result.lovePrediction,
          careerPrediction: result.careerPrediction,
          financePrediction: result.financePrediction,
          healthPrediction: result.healthPrediction,
          luckyNumber: result.luckyNumber,
          luckyColor: result.luckyColor,
          mood: result.mood,
        })
        .returning();
      this.realtime.broadcast('horoscope:updated', r);
      return r;
    } catch (e: any) {
      this.logger.error(
        `Horoscope fetch failed for ${sign}/${date}: ${e.message}`,
      );
      const [cached] = await this.db
        .select()
        .from(schema.horoscopeRecords)
        .where(ilike(schema.horoscopeRecords.zodiacSign, sign))
        .orderBy(desc(schema.horoscopeRecords.date))
        .limit(1);
      if (cached) return cached;
      return {
        id: null,
        zodiacSign: sign,
        date,
        prediction:
          'Horoscope is temporarily unavailable. Please try again later.',
        lovePrediction: null,
        careerPrediction: null,
        financePrediction: null,
        healthPrediction: null,
        luckyNumber: null,
        luckyColor: null,
        mood: null,
        createdAt: new Date(),
      };
    }
  }

  private async backfillCategories(
    existing: typeof schema.horoscopeRecords.$inferSelect,
    sign: string,
    date: string,
  ) {
    const missing = [
      ['lovePrediction', existing.lovePrediction],
      ['careerPrediction', existing.careerPrediction],
      ['financePrediction', existing.financePrediction],
      ['healthPrediction', existing.healthPrediction],
    ].some(([, value]) => !value?.trim());
    if (!missing) return null;

    try {
      const result = await this.astrology.calculateHoroscope(sign, date);
      const updates: Partial<typeof schema.horoscopeRecords.$inferInsert> = {};
      if (!existing.lovePrediction?.trim() && result.lovePrediction?.trim()) {
        updates.lovePrediction = result.lovePrediction;
      }
      if (
        !existing.careerPrediction?.trim() &&
        result.careerPrediction?.trim()
      ) {
        updates.careerPrediction = result.careerPrediction;
      }
      if (
        !existing.financePrediction?.trim() &&
        result.financePrediction?.trim()
      ) {
        updates.financePrediction = result.financePrediction;
      }
      if (
        !existing.healthPrediction?.trim() &&
        result.healthPrediction?.trim()
      ) {
        updates.healthPrediction = result.healthPrediction;
      }
      if (Object.keys(updates).length === 0) return null;

      const [updated] = await this.db
        .update(schema.horoscopeRecords)
        .set(updates)
        .where(eq(schema.horoscopeRecords.id, existing.id))
        .returning();
      this.realtime.broadcast('horoscope:updated', updated);
      return updated;
    } catch (e: any) {
      this.logger.warn(
        `Horoscope category backfill skipped for ${sign}/${date}: ${e.message}`,
      );
      return null;
    }
  }

  async create(data: typeof schema.horoscopeRecords.$inferInsert) {
    const [r] = await this.db
      .insert(schema.horoscopeRecords)
      .values(data)
      .returning();
    this.realtime.broadcast('horoscope:updated', r);
    return r;
  }

  async update(
    id: string,
    data: Partial<typeof schema.horoscopeRecords.$inferInsert>,
  ) {
    const [r] = await this.db
      .update(schema.horoscopeRecords)
      .set(data)
      .where(eq(schema.horoscopeRecords.id, id))
      .returning();
    this.realtime.broadcast('horoscope:updated', r);
    return r;
  }

  async delete(id: string) {
    const [r] = await this.db
      .delete(schema.horoscopeRecords)
      .where(eq(schema.horoscopeRecords.id, id))
      .returning();
    this.realtime.broadcast('horoscope:deleted', { id });
    return r;
  }
}
