import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';
import { AstrologyService } from '../astrology/astrology.service';

@Injectable()
export class PanchangService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly astrology: AstrologyService,
  ) {}

  async findAll() { return this.db.query.panchangRecords.findMany(); }
  async findByDate(date: string) { return this.db.query.panchangRecords.findFirst({ where: eq(schema.panchangRecords.date, date) }); }

  async create(data: typeof schema.panchangRecords.$inferInsert) {
    const result = this.astrology.calculatePanchang(data.date, 28.6139, 77.209, 5.5);
    const [r] = await this.db.insert(schema.panchangRecords).values({
      ...data,
      tithi: data.tithi || result.tithi,
      nakshatra: data.nakshatra || result.nakshatra,
      yoga: data.yoga || result.yoga,
      karana: data.karana || result.karana,
      sunrise: data.sunrise || result.sunrise,
      sunset: data.sunset || result.sunset,
      rahuKaal: (data.rahuKaal || result.rahuKaal) as any,
    }).returning();
    return r;
  }

  async update(id: string, data: Partial<typeof schema.panchangRecords.$inferInsert>) {
    const [r] = await this.db.update(schema.panchangRecords).set(data).where(eq(schema.panchangRecords.id, id)).returning();
    return r;
  }

  async delete(id: string) { await this.db.delete(schema.panchangRecords).where(eq(schema.panchangRecords.id, id)); }
}
