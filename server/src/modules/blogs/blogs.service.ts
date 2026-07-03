import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class BlogsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.blogs.findMany({ orderBy: [desc(schema.blogs.publishedAt)] }); }
  async findBySlug(slug: string) { return this.db.query.blogs.findFirst({ where: eq(schema.blogs.slug, slug) }); }
  async findById(id: string) { return this.db.query.blogs.findFirst({ where: eq(schema.blogs.id, id) }); }

  async create(data: typeof schema.blogs.$inferInsert) { const [r] = await this.db.insert(schema.blogs).values(data).returning(); return r; }
  async update(id: string, data: Partial<typeof schema.blogs.$inferInsert>) {
    const [r] = await this.db.update(schema.blogs).set({ ...data, updatedAt: new Date() }).where(eq(schema.blogs.id, id)).returning(); return r;
  }
  async delete(id: string) { await this.db.delete(schema.blogs).where(eq(schema.blogs.id, id)); }
}
