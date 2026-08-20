import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';
import { AstrologyService, BirthDetails } from '../astrology/astrology.service';

@Injectable()
export class MatchmakingService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly astrology: AstrologyService,
  ) {}

  async findByUserId(userId: string) {
    return this.db.query.matchmakingRecords.findMany({
      where: eq(schema.matchmakingRecords.userId, userId),
    });
  }
  async findById(id: string) {
    return this.db.query.matchmakingRecords.findFirst({
      where: eq(schema.matchmakingRecords.id, id),
    });
  }

  async create(data: typeof schema.matchmakingRecords.$inferInsert) {
    const norm = (t: string) => {
      const p = (t || '').split(':');
      return p.length === 2 ? `${t}:00` : p.length === 3 ? t : '06:00:00';
    };
    const details1: BirthDetails = {
      dateString: data.person1Dob,
      timeString: norm(data.person1Tob),
      lat: 28.6139,
      lng: 77.209,
      timezone: 5.5,
    };
    const details2: BirthDetails = {
      dateString: data.person2Dob,
      timeString: norm(data.person2Tob),
      lat: 28.6139,
      lng: 77.209,
      timezone: 5.5,
    };
    const result = await this.astrology.calculateMatchmaking(
      details1,
      details2,
    );
    const [r] = await this.db
      .insert(schema.matchmakingRecords)
      .values({
        ...data,
        matchScore: result.totalScore,
        matchDetails: result as any,
      })
      .returning();
    return r;
  }
}
