import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class DonationsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.donations.findMany(); }
  async findByUserId(userId: string) { return this.db.query.donations.findMany({ where: eq(schema.donations.userId, userId) }); }

  async create(data: typeof schema.donations.$inferInsert) {
    const [r] = await this.db.insert(schema.donations).values(data).returning(); return r;
  }
}
