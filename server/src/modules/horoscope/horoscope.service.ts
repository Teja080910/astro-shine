import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, ilike } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';

@Injectable()
export class HoroscopeService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
  ) {}

  async findAll() { return this.db.query.horoscopeRecords.findMany(); }
  async findBySign(sign: string) { return this.db.query.horoscopeRecords.findMany({ where: ilike(schema.horoscopeRecords.zodiacSign, sign) }); }
  async findBySignAndDate(sign: string, date: string) {
    return this.db.query.horoscopeRecords.findFirst({ where: and(ilike(schema.horoscopeRecords.zodiacSign, sign), eq(schema.horoscopeRecords.date, date)) });
  }

  async create(data: typeof schema.horoscopeRecords.$inferInsert) {
    const [r] = await this.db.insert(schema.horoscopeRecords).values(data).returning();
    this.realtime.broadcast('horoscope:updated', r);
    return r;
  }

  async update(id: string, data: Partial<typeof schema.horoscopeRecords.$inferInsert>) {
    const [r] = await this.db.update(schema.horoscopeRecords)
      .set(data)
      .where(eq(schema.horoscopeRecords.id, id))
      .returning();
    this.realtime.broadcast('horoscope:updated', r);
    return r;
  }

  async delete(id: string) {
    const [r] = await this.db.delete(schema.horoscopeRecords)
      .where(eq(schema.horoscopeRecords.id, id))
      .returning();
    this.realtime.broadcast('horoscope:deleted', { id });
    return r;
  }
}
