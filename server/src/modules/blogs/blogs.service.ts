import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc, and } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BlogsService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll() { return this.db.query.blogs.findMany({ orderBy: [desc(schema.blogs.publishedAt)] }); }

  async findPublished() {
    return this.db.query.blogs.findMany({
      where: eq(schema.blogs.status, 'published'),
      orderBy: [desc(schema.blogs.publishedAt)],
    });
  }

  async findByAuthorId(authorId: string) {
    return this.db.query.blogs.findMany({
      where: eq(schema.blogs.authorId, authorId),
      orderBy: [desc(schema.blogs.createdAt)],
    });
  }

  async findBySlug(slug: string) { return this.db.query.blogs.findFirst({ where: eq(schema.blogs.slug, slug) }); }
  async findById(id: string) { return this.db.query.blogs.findFirst({ where: eq(schema.blogs.id, id) }); }

  async create(data: typeof schema.blogs.$inferInsert) {
    const [r] = await this.db.insert(schema.blogs).values(data).returning();
    if (r.status === 'published') this.notifyPublished(r);
    return r;
  }

  async update(id: string, data: Partial<typeof schema.blogs.$inferInsert>) {
    const [r] = await this.db.update(schema.blogs).set({ ...data, updatedAt: new Date() }).where(eq(schema.blogs.id, id)).returning();
    this.realtime.broadcast('blog:updated', r);
    if (data.status === 'published') {
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
    const users = await this.db.query.users.findMany({ where: eq(schema.users.isActive, true), columns: { id: true } });
    const astrologers = await this.db.query.astrologers.findMany({ columns: { userId: true } });
    for (const u of users) {
      this.notifications.create({ userId: u.id, type: 'promotional', title: 'New Blog', body: blog.title, data: { blogId: blog.id } }).catch(() => {});
    }
    for (const a of astrologers) {
      this.notifications.create({ astrologerId: a.userId, type: 'promotional', title: 'New Blog', body: blog.title, data: { blogId: blog.id } }).catch(() => {});
    }
  }
}
