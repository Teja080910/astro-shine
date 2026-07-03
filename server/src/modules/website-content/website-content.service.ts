import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class WebsiteContentService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.websiteContent.findMany({ where: eq(schema.websiteContent.isActive, true) }); }
  async findBySection(section: string) { return this.db.query.websiteContent.findFirst({ where: eq(schema.websiteContent.section, section) }); }
  async findAllAdmin() { return this.db.query.websiteContent.findMany(); }

  async upsert(section: string, content: any, updatedBy?: string) {
    const existing = await this.findBySectionAdmin(section);
    if (existing) {
      const [r] = await this.db.update(schema.websiteContent).set({ content, updatedBy, updatedAt: new Date() }).where(eq(schema.websiteContent.id, existing.id)).returning(); return r;
    }
    const [r] = await this.db.insert(schema.websiteContent).values({ section, content, updatedBy }).returning(); return r;
  }

  private async findBySectionAdmin(section: string) { return this.db.query.websiteContent.findFirst({ where: eq(schema.websiteContent.section, section) }); }
}
