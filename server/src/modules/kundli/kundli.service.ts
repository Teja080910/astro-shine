import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';
import { AstrologyService, BirthDetails } from '../astrology/astrology.service';

@Injectable()
export class KundliService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly astrology: AstrologyService,
  ) {}

  async findByUserId(userId: string) {
    return this.db.query.kundliRecords.findMany({
      where: eq(schema.kundliRecords.userId, userId),
    });
  }
  async findById(id: string) {
    return this.db.query.kundliRecords.findFirst({
      where: eq(schema.kundliRecords.id, id),
    });
  }

  async create(data: typeof schema.kundliRecords.$inferInsert) {
    const parts = (data.timeOfBirth || '').split(':');
    const timeStr =
      parts.length === 2
        ? `${data.timeOfBirth}:00`
        : parts.length === 3
          ? data.timeOfBirth
          : '06:00:00';
    const details: BirthDetails = {
      dateString: data.dateOfBirth,
      timeString: timeStr,
      lat: Number(data.latitude) || 28.6139,
      lng: Number(data.longitude) || 77.209,
      timezone: Number(data.timezone) || 5.5,
    };
    const result = await this.astrology.calculateKundli(details);
    const [r] = await this.db
      .insert(schema.kundliRecords)
      .values({
        ...data,
        chartData: result,
        planetaryPositions: result.planetaryPositions as any,
      })
      .returning();
    return r;
  }

  async update(
    id: string,
    data: Partial<typeof schema.kundliRecords.$inferInsert>,
  ) {
    const [r] = await this.db
      .update(schema.kundliRecords)
      .set(data)
      .where(eq(schema.kundliRecords.id, id))
      .returning();
    return r;
  }
}
