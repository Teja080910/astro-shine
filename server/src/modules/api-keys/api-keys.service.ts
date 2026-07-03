import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class ApiKeysService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.apiKeys.findMany(); }
  async findByProvider(provider: string) { return this.db.query.apiKeys.findMany({ where: eq(schema.apiKeys.provider, provider) }); }

  async create(data: typeof schema.apiKeys.$inferInsert) { const [r] = await this.db.insert(schema.apiKeys).values(data).returning(); return r; }
  async update(id: string, data: Partial<typeof schema.apiKeys.$inferInsert>) {
    const [r] = await this.db.update(schema.apiKeys).set({ ...data, updatedAt: new Date() }).where(eq(schema.apiKeys.id, id)).returning(); return r;
  }
}
