import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class SettingsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.appSettings.findMany(); }
  async findByKey(key: string) { return this.db.query.appSettings.findFirst({ where: eq(schema.appSettings.key, key) }); }

  async set(key: string, value: any, updatedBy?: string, description?: string) {
    const existing = await this.findByKey(key);
    if (existing) {
      const [r] = await this.db.update(schema.appSettings)
        .set({ value, updatedBy, description, updatedAt: new Date() })
        .where(eq(schema.appSettings.id, existing.id)).returning(); return r;
    }
    const [r] = await this.db.insert(schema.appSettings).values({ key, value, updatedBy, description }).returning(); return r;
  }
}
