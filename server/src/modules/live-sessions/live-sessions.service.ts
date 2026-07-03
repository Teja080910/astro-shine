import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class LiveSessionsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.liveSessions.findMany(); }
  async findLive() { return this.db.query.liveSessions.findMany({ where: eq(schema.liveSessions.status, 'live') }); }
  async findByAstrologerId(astrologerId: string) { return this.db.query.liveSessions.findMany({ where: eq(schema.liveSessions.astrologerId, astrologerId) }); }
  async findById(id: string) { return this.db.query.liveSessions.findFirst({ where: eq(schema.liveSessions.id, id) }); }

  async create(data: typeof schema.liveSessions.$inferInsert) { const [r] = await this.db.insert(schema.liveSessions).values(data).returning(); return r; }

  async updateStatus(id: string, status: string) {
    const updates: any = { status, updatedAt: new Date() };
    if (status === 'live') updates.startedAt = new Date();
    if (status === 'ended') updates.endedAt = new Date();
    const [r] = await this.db.update(schema.liveSessions).set(updates).where(eq(schema.liveSessions.id, id)).returning(); return r;
  }
}
