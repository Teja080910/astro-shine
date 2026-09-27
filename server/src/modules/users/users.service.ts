import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';
import { paginated, type Pagination } from '../../common/utils/pagination';

@Injectable()
export class UsersService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(pagination?: Pagination) {
    const roleWhere = eq(schema.users.role, 'user');
    const where = pagination?.q
      ? and(
          roleWhere,
          or(
            ilike(schema.users.name, `%${pagination.q}%`),
            ilike(schema.users.email, `%${pagination.q}%`),
            ilike(schema.users.phone, `%${pagination.q}%`),
          ),
        )
      : roleWhere;

    if (!pagination?.enabled) {
      return this.db.query.users.findMany({ where });
    }

    const [data, countRows] = await Promise.all([
      this.db.query.users.findMany({
        where,
        orderBy: desc(schema.users.createdAt),
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.users)
        .where(where),
    ]);
    return paginated(data, Number(countRows[0]?.count || 0), pagination);
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
    const cleanedData = { ...data };
    if (cleanedData.dateOfBirth === '') {
      cleanedData.dateOfBirth = null;
    }
    const [user] = await this.db
      .update(schema.users)
      .set({ ...cleanedData, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async softDelete(id: string) {
    await this.db
      .update(schema.users)
      .set({ deletedAt: new Date(), updatedAt: new Date(), isActive: false })
      .where(eq(schema.users.id, id));
  }
}
