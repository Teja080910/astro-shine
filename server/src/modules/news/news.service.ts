import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class NewsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.news.findMany({ where: eq(schema.news.isActive, true) }); }
  async findAllAdmin() { return this.db.query.news.findMany(); }
  async findById(id: string) { return this.db.query.news.findFirst({ where: eq(schema.news.id, id) }); }

  async create(data: typeof schema.news.$inferInsert) { const [r] = await this.db.insert(schema.news).values(data).returning(); return r; }
  async update(id: string, data: Partial<typeof schema.news.$inferInsert>) {
    const [r] = await this.db.update(schema.news).set({ ...data, updatedAt: new Date() }).where(eq(schema.news.id, id)).returning(); return r;
  }
}
