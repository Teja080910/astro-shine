import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class VideosService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.videos.findMany({ where: eq(schema.videos.isActive, true) }); }
  async findByCategory(category: string) { return this.db.query.videos.findMany({ where: eq(schema.videos.category, category) }); }
  async findAllAdmin() { return this.db.query.videos.findMany(); }
  async findById(id: string) { return this.db.query.videos.findFirst({ where: eq(schema.videos.id, id) }); }

  async create(data: typeof schema.videos.$inferInsert) { const [r] = await this.db.insert(schema.videos).values(data).returning(); return r; }
  async update(id: string, data: Partial<typeof schema.videos.$inferInsert>) {
    const [r] = await this.db.update(schema.videos).set({ ...data, updatedAt: new Date() }).where(eq(schema.videos.id, id)).returning(); return r;
  }
}
