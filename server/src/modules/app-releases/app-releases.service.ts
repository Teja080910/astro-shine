import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class AppReleasesService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.appReleases.findMany(); }
  async findByApp(appName: string, platform?: string) {
    if (platform) return this.db.query.appReleases.findMany({ where: eq(schema.appReleases.appName, appName) });
    return this.db.query.appReleases.findMany({ where: eq(schema.appReleases.appName, appName) });
  }
  async findById(id: string) { return this.db.query.appReleases.findFirst({ where: eq(schema.appReleases.id, id) }); }

  async create(data: typeof schema.appReleases.$inferInsert) { const [r] = await this.db.insert(schema.appReleases).values(data).returning(); return r; }
  async update(id: string, data: Partial<typeof schema.appReleases.$inferInsert>) {
    const [r] = await this.db.update(schema.appReleases).set({ ...data, updatedAt: new Date() }).where(eq(schema.appReleases.id, id)).returning(); return r;
  }
}
