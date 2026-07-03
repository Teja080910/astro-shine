import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db.query.users.findMany();
  }

  async findById(id: string) {
    return this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
  }

  async findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
  }

  async findByPhone(phone: string) {
    return this.db.query.users.findFirst({
      where: eq(schema.users.phone, phone),
    });
  }

  async create(data: typeof schema.users.$inferInsert) {
    const [user] = await this.db.insert(schema.users).values(data).returning();
    return user;
  }

  async update(id: string, data: Partial<typeof schema.users.$inferInsert>) {
    const [user] = await this.db
      .update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async softDelete(id: string) {
    await this.db
      .update(schema.users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.users.id, id));
  }
}
