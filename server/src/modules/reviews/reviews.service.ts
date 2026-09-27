import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { paginated, Pagination } from '../../common/utils/pagination';

@Injectable()
export class ReviewsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  private async findManyPaginated(base: any, pagination?: Pagination) {
    if (!pagination?.enabled) return this.db.query.reviews.findMany({ where: base });
    const conditions: any[] = [base];
    if (pagination.q) {
      const pattern = `%${pagination.q}%`;
      conditions.push(or(
        ilike(schema.reviews.comment, pattern),
        sql`${schema.reviews.rating}::text ILIKE ${pattern}`,
      ));
    }
    const where = and(...conditions);
    const build = () => this.db.select().from(schema.reviews).where(where);
    const [data, countRows] = await Promise.all([
      build().orderBy(desc(schema.reviews.createdAt)).limit(pagination.limit).offset(pagination.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.reviews).where(where),
    ]);
    return paginated(data, countRows[0]?.count ?? 0, pagination);
  }

  async findByAstrologerId(astrologerId: string, pagination?: Pagination) {
    return this.findManyPaginated(eq(schema.reviews.astrologerId, astrologerId), pagination);
  }
  async findById(id: string) { return this.db.query.reviews.findFirst({ where: eq(schema.reviews.id, id) }); }
  async findByUserId(userId: string, pagination?: Pagination) {
    return this.findManyPaginated(eq(schema.reviews.userId, userId), pagination);
  }

  async create(data: typeof schema.reviews.$inferInsert) { const [r] = await this.db.insert(schema.reviews).values(data).returning(); return r; }

  async toggleVisibility(id: string, isVisible: boolean) {
    const [r] = await this.db.update(schema.reviews).set({ isVisible, updatedAt: new Date() }).where(eq(schema.reviews.id, id)).returning(); return r;
  }

  async findAllReviews(pagination?: Pagination) {
    type ReviewRow = {
      id: string; user_id: string; user_name: string; astrologer_id: string;
      astrologer_name: string; rating: number; comment: string;
      is_visible: boolean; created_at: string; updated_at: string;
    };
    const pattern = pagination?.q ? `%${pagination.q}%` : undefined;
    const whereSql = pattern
      ? sql`WHERE (r.comment ILIKE ${pattern} OR r.rating::text ILIKE ${pattern})`
      : sql``;
    const selectSql = sql`
      SELECT r.id, r.user_id, r.astrologer_id, r.rating, r.comment,
             r.is_visible, r.created_at, r.updated_at,
             COALESCE(u1.name, '') AS user_name,
             COALESCE(u2.name, '') AS astrologer_name`;
    const fromSql = sql`
      FROM reviews r
      LEFT JOIN users u1 ON r.user_id = u1.id
      LEFT JOIN astrologers a ON r.astrologer_id = a.user_id
      LEFT JOIN users u2 ON a.user_id = u2.id
      ${whereSql}`;
    const mapRow = (r: ReviewRow) => ({
      id: r.id, userId: r.user_id, userName: r.user_name,
      astrologerId: r.astrologer_id, astrologerName: r.astrologer_name,
      rating: r.rating, comment: r.comment,
      isVisible: r.is_visible, createdAt: r.created_at, updatedAt: r.updated_at,
    });

    if (!pagination?.enabled) {
      const result = await this.db.execute<ReviewRow>(sql`${selectSql} ${fromSql} ORDER BY r.created_at DESC`);
      return result.rows.map(mapRow);
    }
    const [dataResult, countResult] = await Promise.all([
      this.db.execute<ReviewRow>(sql`${selectSql} ${fromSql} ORDER BY r.created_at DESC LIMIT ${pagination.limit} OFFSET ${pagination.offset}`),
      this.db.execute<{ count: number }>(sql`SELECT COUNT(*)::int AS count ${fromSql}`),
    ]);
    return paginated(dataResult.rows.map(mapRow), countResult.rows[0]?.count ?? 0, pagination);
  }
}
