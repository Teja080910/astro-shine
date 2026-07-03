import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class HoroscopeService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.horoscopeRecords.findMany(); }
  async findBySign(sign: string) { return this.db.query.horoscopeRecords.findMany({ where: eq(schema.horoscopeRecords.zodiacSign, sign) }); }
  async findBySignAndDate(sign: string, date: string) {
    return this.db.query.horoscopeRecords.findFirst({ where: and(eq(schema.horoscopeRecords.zodiacSign, sign), eq(schema.horoscopeRecords.date, date)) });
  }

  async create(data: typeof schema.horoscopeRecords.$inferInsert) {
    const [r] = await this.db.insert(schema.horoscopeRecords).values(data).returning(); return r;
  }
}
