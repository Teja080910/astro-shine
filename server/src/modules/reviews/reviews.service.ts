import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class ReviewsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findByAstrologerId(astrologerId: string) { return this.db.query.reviews.findMany({ where: eq(schema.reviews.astrologerId, astrologerId) }); }
  async findById(id: string) { return this.db.query.reviews.findFirst({ where: eq(schema.reviews.id, id) }); }
  async findByUserId(userId: string) { return this.db.query.reviews.findMany({ where: eq(schema.reviews.userId, userId) }); }

  async create(data: typeof schema.reviews.$inferInsert) { const [r] = await this.db.insert(schema.reviews).values(data).returning(); return r; }

  async toggleVisibility(id: string, isVisible: boolean) {
    const [r] = await this.db.update(schema.reviews).set({ isVisible, updatedAt: new Date() }).where(eq(schema.reviews.id, id)).returning(); return r;
  }

  async findAllReviews() {
    return this.db
      .select({
        id: schema.reviews.id,
        userId: schema.reviews.userId,
        userName: schema.users.name,
        astrologerId: schema.reviews.astrologerId,
        astrologerName: schema.astrologers.name,
        rating: schema.reviews.rating,
        comment: schema.reviews.comment,
        isVisible: schema.reviews.isVisible,
        createdAt: schema.reviews.createdAt,
        updatedAt: schema.reviews.updatedAt,
      })
      .from(schema.reviews)
      .leftJoin(schema.users, eq(schema.reviews.userId, schema.users.id))
      .leftJoin(schema.astrologers, eq(schema.reviews.astrologerId, schema.astrologers.id));
  }
}
