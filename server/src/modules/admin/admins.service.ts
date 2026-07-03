import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class AdminsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.admins.findMany(); }
  async findById(id: string) { return this.db.query.admins.findFirst({ where: eq(schema.admins.id, id) }); }
  async findByEmail(email: string) { return this.db.query.admins.findFirst({ where: eq(schema.admins.email, email) }); }

  async create(data: typeof schema.admins.$inferInsert) {
    const [r] = await this.db.insert(schema.admins).values(data).returning(); return r;
  }
}
