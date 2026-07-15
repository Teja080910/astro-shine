import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';

@Injectable()
export class MuhuratCategoriesService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
  ) {}

  async findAll() {
    return this.db.query.muhuratCategories.findMany();
  }

  async findAllActive() {
    return this.db.query.muhuratCategories.findMany({
      where: eq(schema.muhuratCategories.isActive, true),
    });
  }

  async findById(id: string) {
    return this.db.query.muhuratCategories.findFirst({
      where: eq(schema.muhuratCategories.id, id),
    });
  }

  async create(data: typeof schema.muhuratCategories.$inferInsert) {
    const [r] = await this.db.insert(schema.muhuratCategories).values(data).returning();
    this.realtime.broadcast('muhurat-category:created', r);
    return r;
  }

  async update(id: string, data: Partial<typeof schema.muhuratCategories.$inferInsert>) {
    const [r] = await this.db
      .update(schema.muhuratCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.muhuratCategories.id, id))
      .returning();
    this.realtime.broadcast('muhurat-category:updated', r);
    return r;
  }
}
