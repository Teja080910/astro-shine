import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql } from 'drizzle-orm';

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
    const result = await this.db.execute<{
      id: string; user_id: string; user_name: string; astrologer_id: string;
      astrologer_name: string; rating: number; comment: string;
      is_visible: boolean; created_at: string; updated_at: string;
    }>(sql`
      SELECT r.id, r.user_id, r.astrologer_id, r.rating, r.comment,
             r.is_visible, r.created_at, r.updated_at,
             COALESCE(u1.name, '') AS user_name,
             COALESCE(u2.name, '') AS astrologer_name
      FROM reviews r
      LEFT JOIN users u1 ON r.user_id = u1.id
      LEFT JOIN astrologers a ON r.astrologer_id = a.user_id
      LEFT JOIN users u2 ON a.user_id = u2.id
      ORDER BY r.created_at DESC
    `);
    return result.rows.map(r => ({
      id: r.id, userId: r.user_id, userName: r.user_name,
      astrologerId: r.astrologer_id, astrologerName: r.astrologer_name,
      rating: r.rating, comment: r.comment,
      isVisible: r.is_visible, createdAt: r.created_at, updatedAt: r.updated_at,
    }));
  }
}
