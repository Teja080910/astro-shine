import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { desc, eq, or, ilike, sql } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import {
  paginated,
  Pagination,
} from '../../common/utils/pagination';

@Injectable()
export class NewsService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
  ) {}

  async findAll() {
    return this.db.query.news.findMany({
      where: eq(schema.news.isActive, true),
      orderBy: [desc(schema.news.createdAt)],
    });
  }

  async findAllAdmin(pagination?: Pagination) {
    const where = pagination?.q
      ? or(
          ilike(schema.news.title, `%${pagination.q}%`),
          ilike(schema.news.content, `%${pagination.q}%`),
        )
      : undefined;

    if (!pagination?.enabled) {
      return this.db.query.news.findMany({
        where,
        orderBy: [desc(schema.news.createdAt)],
      });
    }

    const [data, countRows] = await Promise.all([
      this.db.query.news.findMany({
        where,
        orderBy: [desc(schema.news.createdAt)],
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.news)
        .where(where),
    ]);
    return paginated(data, Number(countRows[0]?.count || 0), pagination);
  }

  async findById(id: string) { return this.db.query.news.findFirst({ where: eq(schema.news.id, id) }); }

  async create(data: typeof schema.news.$inferInsert) {
    const [r] = await this.db.insert(schema.news).values(data).returning();
    this.realtime.broadcast('news:updated', r);
    return r;
  }

  async update(id: string, data: Partial<typeof schema.news.$inferInsert>) {
    const [r] = await this.db.update(schema.news).set({ ...data, updatedAt: new Date() }).where(eq(schema.news.id, id)).returning();
    this.realtime.broadcast('news:updated', r);
    return r;
  }

  async delete(id: string) {
    await this.db.delete(schema.news).where(eq(schema.news.id, id));
    this.realtime.broadcast('news:deleted', { id });
  }
}
