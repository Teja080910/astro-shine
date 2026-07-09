import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';

@Injectable()
export class AstrologersService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
  ) {}

  async findAll() { return this.db.query.astrologers.findMany(); }

  async findById(id: string) {
    return this.db.query.astrologers.findFirst({ where: eq(schema.astrologers.id, id) });
  }

  async findByEmail(email: string) {
    return this.db.query.astrologers.findFirst({ where: eq(schema.astrologers.email, email) });
  }

  async create(data: typeof schema.astrologers.$inferInsert) {
    const [result] = await this.db.insert(schema.astrologers).values(data).returning();
    return result;
  }

  async update(id: string, data: Partial<typeof schema.astrologers.$inferInsert>) {
    const [result] = await this.db.update(schema.astrologers)
      .set({ ...data, updatedAt: new Date() }).where(eq(schema.astrologers.id, id)).returning();
    return result;
  }

  async verify(id: string, status: 'approved' | 'rejected', note?: string) {
    return this.update(id, { verificationStatus: status, verificationNote: note } as any);
  }

  async updateOnlineStatus(id: string, onlineStatus: 'online' | 'offline' | 'busy') {
    const result = await this.update(id, { onlineStatus } as any);
    this.realtime.broadcast('astrologer:status-changed', { astrologerId: id, onlineStatus });
    return result;
  }

  async delete(id: string) {
    const [result] = await this.db.update(schema.astrologers)
      .set({ isActive: false }).where(eq(schema.astrologers.id, id)).returning();
    return result;
  }
}
