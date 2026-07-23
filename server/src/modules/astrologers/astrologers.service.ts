import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc, sql } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';

@Injectable()
export class AstrologersService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
  ) {}

  async findAll() { return this.db.query.astrologers.findMany(); }

  async findById(id: string) {
    const astro = await this.db.query.astrologers.findFirst({ where: eq(schema.astrologers.id, id) });
    if (!astro) return null;
    const [ratingResult] = await this.db
      .select({ avg: sql<string>`COALESCE(AVG(ratings::decimal), 0)` })
      .from(schema.feedback)
      .where(eq(schema.feedback.astrologerId, id));
    return { ...astro, rating: Number(ratingResult?.avg || 0).toFixed(1) };
  }

  async findByEmail(email: string) {
    return this.db.query.astrologers.findFirst({ where: eq(schema.astrologers.email, email) });
  }

  async findByPhone(phone: string) {
    return this.db.query.astrologers.findFirst({ where: eq(schema.astrologers.phone, phone) });
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

  async submitFeedback(astrologerId: string, userId: string, ratings: number, comments?: string) {
    if (!Number.isInteger(ratings) || ratings < 1 || ratings > 5) {
      throw new BadRequestException('Ratings must be an integer between 1 and 5');
    }
    const [feedback] = await this.db.insert(schema.feedback).values({
      astrologerId,
      userId,
      ratings: ratings.toFixed(1),
      comments,
    }).returning();
    return feedback;
  }

  async getFeedback(astrologerId: string) {
    return this.db.select()
      .from(schema.feedback)
      .where(eq(schema.feedback.astrologerId, astrologerId))
      .orderBy(desc(schema.feedback.createdAt));
  }
}
