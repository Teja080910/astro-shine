import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc, or, ilike, sql } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import {
  paginated,
  Pagination,
} from '../../common/utils/pagination';

@Injectable()
export class VideosService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
  ) {}

  async findAll() { return this.db.query.videos.findMany({ where: eq(schema.videos.isActive, true), orderBy: [desc(schema.videos.createdAt)] }); }
  async findByCategory(category: string) { return this.db.query.videos.findMany({ where: eq(schema.videos.category, category), orderBy: [desc(schema.videos.createdAt)] }); }

  async findAllAdmin(pagination?: Pagination) {
    const where = pagination?.q
      ? or(
          ilike(schema.videos.title, `%${pagination.q}%`),
          ilike(schema.videos.category, `%${pagination.q}%`),
        )
      : undefined;

    if (!pagination?.enabled) {
      return this.db.query.videos.findMany({
        where,
        orderBy: [desc(schema.videos.createdAt)],
      });
    }

    const [data, countRows] = await Promise.all([
      this.db.query.videos.findMany({
        where,
        orderBy: [desc(schema.videos.createdAt)],
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.videos)
        .where(where),
    ]);
    return paginated(data, Number(countRows[0]?.count || 0), pagination);
  }

  async findById(id: string) { return this.db.query.videos.findFirst({ where: eq(schema.videos.id, id) }); }

  async create(data: typeof schema.videos.$inferInsert) {
    const [r] = await this.db.insert(schema.videos).values(data).returning();
    this.realtime.broadcast('videos:updated', r);
    return r;
  }
  async update(id: string, data: Partial<typeof schema.videos.$inferInsert>) {
    const [r] = await this.db.update(schema.videos).set({ ...data, updatedAt: new Date() }).where(eq(schema.videos.id, id)).returning();
    this.realtime.broadcast('videos:updated', r);
    return r;
  }
}
