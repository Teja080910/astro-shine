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

  async findAll() {
    return this.db
      .select({
        userId: schema.astrologers.userId,
        bio: schema.astrologers.bio,
        experience: schema.astrologers.experience,
        specialization: schema.astrologers.specialization,
        languages: schema.astrologers.languages,
        skills: schema.astrologers.skills,
        pricePerMin: schema.astrologers.pricePerMin,
        rating: schema.astrologers.rating,
        totalReviews: schema.astrologers.totalReviews,
        chatPricePerMin: schema.astrologers.chatPricePerMin,
        audioCallPricePerMin: schema.astrologers.audioCallPricePerMin,
        videoCallPricePerMin: schema.astrologers.videoCallPricePerMin,
        totalChats: schema.astrologers.totalChats,
        totalAudioCalls: schema.astrologers.totalAudioCalls,
        totalVideoCalls: schema.astrologers.totalVideoCalls,
        totalCalls: schema.astrologers.totalCalls,
        totalEarnings: schema.astrologers.totalEarnings,
        verificationStatus: schema.astrologers.verificationStatus,
        verificationDoc: schema.astrologers.verificationDoc,
        verificationNote: schema.astrologers.verificationNote,
        onlineStatus: schema.astrologers.onlineStatus,
        createdAt: schema.astrologers.createdAt,
        updatedAt: schema.astrologers.updatedAt,
        name: schema.users.name,
        email: schema.users.email,
        phone: schema.users.phone,
        isActive: schema.users.isActive,
      })
      .from(schema.astrologers)
      .leftJoin(schema.users, eq(schema.astrologers.userId, schema.users.id));
  }

  async findByUserId(userId: string) {
    const [astro] = await this.db
      .select({
        userId: schema.astrologers.userId,
        bio: schema.astrologers.bio,
        experience: schema.astrologers.experience,
        specialization: schema.astrologers.specialization,
        languages: schema.astrologers.languages,
        skills: schema.astrologers.skills,
        pricePerMin: schema.astrologers.pricePerMin,
        rating: schema.astrologers.rating,
        totalReviews: schema.astrologers.totalReviews,
        chatPricePerMin: schema.astrologers.chatPricePerMin,
        audioCallPricePerMin: schema.astrologers.audioCallPricePerMin,
        videoCallPricePerMin: schema.astrologers.videoCallPricePerMin,
        totalChats: schema.astrologers.totalChats,
        totalAudioCalls: schema.astrologers.totalAudioCalls,
        totalVideoCalls: schema.astrologers.totalVideoCalls,
        totalCalls: schema.astrologers.totalCalls,
        totalEarnings: schema.astrologers.totalEarnings,
        verificationStatus: schema.astrologers.verificationStatus,
        verificationDoc: schema.astrologers.verificationDoc,
        verificationNote: schema.astrologers.verificationNote,
        onlineStatus: schema.astrologers.onlineStatus,
        createdAt: schema.astrologers.createdAt,
        updatedAt: schema.astrologers.updatedAt,
        name: schema.users.name,
        email: schema.users.email,
        phone: schema.users.phone,
        isActive: schema.users.isActive,
      })
      .from(schema.astrologers)
      .leftJoin(schema.users, eq(schema.astrologers.userId, schema.users.id))
      .where(eq(schema.astrologers.userId, userId));
    return astro || null;
  }

  async findById(id: string) {
    const astro = await this.findByUserId(id);
    if (!astro) return null;
    const [ratingResult] = await this.db
      .select({ avg: sql<string>`COALESCE(AVG(ratings::decimal), 0)` })
      .from(schema.feedback)
      .where(eq(schema.feedback.astrologerId, id));
    return { ...astro, rating: Number(ratingResult?.avg || 0).toFixed(1) };
  }

  async create(data: typeof schema.astrologers.$inferInsert) {
    const [result] = await this.db.insert(schema.astrologers).values(data).returning();
    return result;
  }

  async update(id: string, data: Partial<typeof schema.astrologers.$inferInsert>) {
    const [result] = await this.db.update(schema.astrologers)
      .set({ ...data, updatedAt: new Date() }).where(eq(schema.astrologers.userId, id)).returning();
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
    const [result] = await this.db.update(schema.users)
      .set({ isActive: false, updatedAt: new Date() }).where(eq(schema.users.id, id)).returning();
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
