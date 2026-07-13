import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';

@Injectable()
export class PanchangService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
  ) {}

  async findAll() { return this.db.query.panchangRecords.findMany(); }
  async findByDate(date: string) { return this.db.query.panchangRecords.findFirst({ where: eq(schema.panchangRecords.date, date) }); }

  async create(data: typeof schema.panchangRecords.$inferInsert) {
    const [r] = await this.db.insert(schema.panchangRecords).values(data).returning();
    this.realtime.broadcast('panchang:updated', r);
    return r;
  }

  async update(id: string, data: Partial<typeof schema.panchangRecords.$inferInsert>) {
    const [r] = await this.db.update(schema.panchangRecords)
      .set(data)
      .where(eq(schema.panchangRecords.id, id))
      .returning();
    this.realtime.broadcast('panchang:updated', r);
    return r;
  }

  async delete(id: string) {
    const [r] = await this.db.delete(schema.panchangRecords)
      .where(eq(schema.panchangRecords.id, id))
      .returning();
    this.realtime.broadcast('panchang:deleted', { id });
    return r;
  }
}
