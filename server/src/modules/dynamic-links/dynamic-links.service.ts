import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class DynamicLinksService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.dynamicLinks.findMany({ where: eq(schema.dynamicLinks.isActive, true) }); }
  async findByPage(pageName: string) { return this.db.query.dynamicLinks.findFirst({ where: eq(schema.dynamicLinks.pageName, pageName) }); }
  async findAllAdmin() { return this.db.query.dynamicLinks.findMany(); }

  async create(data: typeof schema.dynamicLinks.$inferInsert) { const [r] = await this.db.insert(schema.dynamicLinks).values(data).returning(); return r; }
  async update(id: string, data: Partial<typeof schema.dynamicLinks.$inferInsert>) {
    const [r] = await this.db.update(schema.dynamicLinks).set({ ...data, updatedAt: new Date() }).where(eq(schema.dynamicLinks.id, id)).returning(); return r;
  }
}
