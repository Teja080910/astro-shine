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
}
