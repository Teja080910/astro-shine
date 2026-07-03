import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class KundliService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findByUserId(userId: string) { return this.db.query.kundliRecords.findMany({ where: eq(schema.kundliRecords.userId, userId) }); }
  async findById(id: string) { return this.db.query.kundliRecords.findFirst({ where: eq(schema.kundliRecords.id, id) }); }

  async create(data: typeof schema.kundliRecords.$inferInsert) {
    const [r] = await this.db.insert(schema.kundliRecords).values(data).returning(); return r;
  }

  async update(id: string, data: Partial<typeof schema.kundliRecords.$inferInsert>) {
    const [r] = await this.db.update(schema.kundliRecords).set(data).where(eq(schema.kundliRecords.id, id)).returning(); return r;
  }
}
