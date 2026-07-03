import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class PanchangService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.panchangRecords.findMany(); }
  async findByDate(date: string) { return this.db.query.panchangRecords.findFirst({ where: eq(schema.panchangRecords.date, date) }); }

  async create(data: typeof schema.panchangRecords.$inferInsert) {
    const [r] = await this.db.insert(schema.panchangRecords).values(data).returning(); return r;
  }
}
