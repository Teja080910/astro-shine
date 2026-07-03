import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class MatchmakingService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findByUserId(userId: string) { return this.db.query.matchmakingRecords.findMany({ where: eq(schema.matchmakingRecords.userId, userId) }); }
  async findById(id: string) { return this.db.query.matchmakingRecords.findFirst({ where: eq(schema.matchmakingRecords.id, id) }); }

  async create(data: typeof schema.matchmakingRecords.$inferInsert) {
    const [r] = await this.db.insert(schema.matchmakingRecords).values(data).returning(); return r;
  }
}
