import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc, and, or, ilike, sql, SQL } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  paginated,
  Pagination,
} from '../../common/utils/pagination';

@Injectable()
export class BlogsService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  private searchWhere(q?: string): SQL | undefined {
    if (!q) return undefined;
    const pattern = `%${q}%`;
    return or(
      ilike(schema.blogs.title, pattern),
      ilike(schema.blogs.slug, pattern),
      sql`${schema.blogs.status}::text ILIKE ${pattern}`,
    );
  }

  async findAll(pagination?: Pagination) {
    const where = this.searchWhere(pagination?.q);

    if (!pagination?.enabled) {
      return this.db.query.blogs.findMany({
        where,
        orderBy: [desc(schema.blogs.publishedAt)],
      });
    }

    const [data, countRows] = await Promise.all([
      this.db.query.blogs.findMany({
        where,
        orderBy: [desc(schema.blogs.publishedAt)],
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.blogs)
        .where(where),
    ]);
    return paginated(data, Number(countRows[0]?.count || 0), pagination);
  }

  async findPublished() {
    return this.db.query.blogs.findMany({
      where: eq(schema.blogs.status, 'published'),
      orderBy: [desc(schema.blogs.publishedAt)],
    });
  }

  async findByAuthorId(authorId: string, pagination?: Pagination) {
    const where = and(
      eq(schema.blogs.authorId, authorId),
      this.searchWhere(pagination?.q),
    );

    if (!pagination?.enabled) {
      return this.db.query.blogs.findMany({
        where,
        orderBy: [desc(schema.blogs.createdAt)],
      });
    }

    const [data, countRows] = await Promise.all([
      this.db.query.blogs.findMany({
        where,
        orderBy: [desc(schema.blogs.createdAt)],
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.blogs)
        .where(where),
    ]);
    return paginated(data, Number(countRows[0]?.count || 0), pagination);
  }

  async findBySlug(slug: string) {
    return this.db.query.blogs.findFirst({
      where: eq(schema.blogs.slug, slug),
    });
  }
  async findById(id: string) {
    return this.db.query.blogs.findFirst({ where: eq(schema.blogs.id, id) });
  }

  private deriveExcerpt(
    content?: string | null,
    maxLength = 180,
  ): string | null {
    if (!content) return null;
    const text = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_`~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return null;
    if (text.length <= maxLength) return text;
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    const cut =
      lastSpace > maxLength * 0.6 ? truncated.slice(0, lastSpace) : truncated;
    return `${cut.trimEnd()}...`;
  }

  private hasExcerpt(value?: string | null) {
    return (
      value !== undefined && value !== null && String(value).trim().length > 0
    );
  }

  async create(data: typeof schema.blogs.$inferInsert) {
    const payload = { ...data };
    if (!this.hasExcerpt(payload.excerpt)) {
      payload.excerpt = this.deriveExcerpt(payload.content);
    }
    const [r] = await this.db.insert(schema.blogs).values(payload).returning();
    if (r.status === 'published') this.notifyPublished(r);
    return r;
  }

  async update(id: string, data: Partial<typeof schema.blogs.$inferInsert>) {
    const existing = await this.findById(id);
    const payload: Partial<typeof schema.blogs.$inferInsert> = { ...data };

    if (payload.content !== undefined && !this.hasExcerpt(payload.excerpt)) {
      payload.excerpt = this.deriveExcerpt(payload.content);
    }

    const [r] = await this.db
      .update(schema.blogs)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(schema.blogs.id, id))
      .returning();
    this.realtime.broadcast('blog:updated', r);

    const becamePublished =
      payload.status === 'published' && existing?.status !== 'published';
    if (becamePublished) {
      this.notifyPublished(r);
    }
    return r;
  }

  async delete(id: string) {
    await this.db.delete(schema.blogs).where(eq(schema.blogs.id, id));
    this.realtime.broadcast('blog:deleted', { id });
  }

  private async notifyPublished(blog: any) {
    this.realtime.broadcast('blog:published', blog);
    const users = await this.db.query.users.findMany({
      where: eq(schema.users.isActive, true),
      columns: { id: true },
    });
    const astrologers = await this.db.query.astrologers.findMany({
      columns: { userId: true },
    });
    for (const u of users) {
      this.notifications
        .create({
          userId: u.id,
          type: 'promotional',
          title: 'New Blog',
          body: blog.title,
          data: { screen: 'BlogDetail', blogId: blog.id },
        })
        .catch(() => {});
    }
    for (const a of astrologers) {
      this.notifications
        .create({
          astrologerId: a.userId,
          type: 'promotional',
          title: 'New Blog',
          body: blog.title,
          data: { screen: 'BlogDetail', blogId: blog.id },
        })
        .catch(() => {});
    }
  }
}
