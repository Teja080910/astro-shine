import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class CallsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.callLogs.findMany(); }
  async findById(id: string) { return this.db.query.callLogs.findFirst({ where: eq(schema.callLogs.id, id) }); }
  async findByUserId(userId: string) { return this.db.query.callLogs.findMany({ where: eq(schema.callLogs.userId, userId) }); }
  async findByAstrologerId(astrologerId: string) { return this.db.query.callLogs.findMany({ where: eq(schema.callLogs.astrologerId, astrologerId) }); }

  async create(data: typeof schema.callLogs.$inferInsert) {
    const [r] = await this.db.insert(schema.callLogs).values(data).returning(); return r;
  }

  async updateStatus(id: string, status: string) {
    const [r] = await this.db.update(schema.callLogs).set({ status: status as any }).where(eq(schema.callLogs.id, id)).returning(); return r;
  }
}
