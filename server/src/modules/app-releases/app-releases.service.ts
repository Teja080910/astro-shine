import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc, and, or, ilike, sql, SQL } from 'drizzle-orm';
import {
  paginated,
  Pagination,
} from '../../common/utils/pagination';

@Injectable()
export class AppReleasesService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  private searchWhere(q?: string): SQL | undefined {
    if (!q) return undefined;
    const pattern = `%${q}%`;
    return or(
      ilike(schema.appReleases.appName, pattern),
      ilike(schema.appReleases.platform, pattern),
      ilike(schema.appReleases.version, pattern),
    );
  }

  private async list(where: SQL | undefined, pagination?: Pagination) {
    if (!pagination?.enabled) {
      return this.db.query.appReleases.findMany({
        where,
        orderBy: [desc(schema.appReleases.createdAt)],
      });
    }

    const [data, countRows] = await Promise.all([
      this.db.query.appReleases.findMany({
        where,
        orderBy: [desc(schema.appReleases.createdAt)],
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.appReleases)
        .where(where),
    ]);
    return paginated(data, Number(countRows[0]?.count || 0), pagination);
  }

  async findAll(pagination?: Pagination) {
    return this.list(this.searchWhere(pagination?.q), pagination);
  }

  async findByApp(appName: string, platform?: string, pagination?: Pagination) {
    const where = and(
      eq(schema.appReleases.appName, appName),
      this.searchWhere(pagination?.q),
    );
    return this.list(where, pagination);
  }
  async findById(id: string) { return this.db.query.appReleases.findFirst({ where: eq(schema.appReleases.id, id) }); }

  async create(data: typeof schema.appReleases.$inferInsert) { const [r] = await this.db.insert(schema.appReleases).values(data).returning(); return r; }
  async update(id: string, data: Partial<typeof schema.appReleases.$inferInsert>) {
    const [r] = await this.db.update(schema.appReleases).set({ ...data, updatedAt: new Date() }).where(eq(schema.appReleases.id, id)).returning(); return r;
  }
}
