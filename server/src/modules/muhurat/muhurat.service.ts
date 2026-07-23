import { Injectable, Inject, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, ne, gte, lte } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';

@Injectable()
export class MuhuratService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
  ) {}

  async enrichEntry(entry: any) {
    if (!entry) return null;
    const cat = await this.db.query.muhuratCategories.findFirst({
      where: eq(schema.muhuratCategories.id, entry.categoryId),
    });

    let createdByName = 'System';
    if (entry.createdBy) {
      const astrologer = await this.db.query.astrologers.findFirst({
        where: eq(schema.astrologers.id, entry.createdBy),
      });
      if (astrologer) {
        createdByName = astrologer.name;
      } else {
        const admin = await this.db.query.admins.findFirst({
          where: eq(schema.admins.id, entry.createdBy),
        });
        if (admin) {
          createdByName = admin.name;
        }
      }
    }

    return {
      ...entry,
      categoryName: cat?.name || 'Unknown',
      createdByName,
    };
  }

  async enrichEntries(entries: any[]) {
    return Promise.all(entries.map((e) => this.enrichEntry(e)));
  }

  async findAll(categoryId?: string, startDate?: string, endDate?: string) {
    const conditions = [eq(schema.muhurat.isActive, true)];
    
    if (categoryId) {
      conditions.push(eq(schema.muhurat.categoryId, categoryId));
    }

    const getTodayString = (offsetDays = 0) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const effectiveStartDate = startDate || getTodayString(0);
    const effectiveEndDate = endDate || getTodayString(3);

    conditions.push(gte(schema.muhurat.date, effectiveStartDate));
    conditions.push(lte(schema.muhurat.date, effectiveEndDate));

    const entries = await this.db.query.muhurat.findMany({
      where: and(...conditions),
    });
    return this.enrichEntries(entries);
  }

  async findAllAdmin() {
    const entries = await this.db.query.muhurat.findMany();
    return this.enrichEntries(entries);
  }

  async findMyEntries(userId: string) {
    const entries = await this.db.query.muhurat.findMany({
      where: eq(schema.muhurat.createdBy, userId),
    });
    return this.enrichEntries(entries);
  }

  async findById(id: string) {
    const entry = await this.db.query.muhurat.findFirst({
      where: eq(schema.muhurat.id, id),
    });
    if (!entry) return null;
    return this.enrichEntry(entry);
  }

  async checkConflict(date: string, time: string, excludeId?: string) {
    const conditions = [
      eq(schema.muhurat.date, date),
      eq(schema.muhurat.time, time),
    ];
    if (excludeId) {
      conditions.push(ne(schema.muhurat.id, excludeId));
    }
    const existing = await this.db.query.muhurat.findFirst({
      where: and(...conditions),
    });
    if (existing) {
      const enriched = await this.enrichEntry(existing);
      const name = enriched?.createdByName || 'System';
      throw new ConflictException(`This time slot is already registered by ${name}`);
    }
  }

  async create(data: typeof schema.muhurat.$inferInsert) {
    await this.checkConflict(data.date, data.time);
    const [r] = await this.db.insert(schema.muhurat).values(data).returning();
    const enriched = await this.enrichEntry(r);
    this.realtime.broadcast('muhurat:created', enriched);
    return enriched;
  }

  async update(id: string, data: Partial<typeof schema.muhurat.$inferInsert>, userId: string | null, role: string) {
    const existing = await this.db.query.muhurat.findFirst({
      where: eq(schema.muhurat.id, id),
    });
    if (!existing) {
      throw new NotFoundException('Muhurat entry not found');
    }

    if (role !== 'admin' && existing.createdBy !== userId) {
      throw new ForbiddenException('You do not have permission to modify this entry');
    }

    if (data.date || data.time) {
      const checkDate = data.date || existing.date;
      const checkTime = data.time || existing.time;
      await this.checkConflict(checkDate, checkTime, id);
    }

    const [r] = await this.db
      .update(schema.muhurat)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.muhurat.id, id))
      .returning();

    const enriched = await this.enrichEntry(r);
    this.realtime.broadcast('muhurat:updated', enriched);
    return enriched;
  }

  async delete(id: string, userId: string | null, role: string) {
    const existing = await this.db.query.muhurat.findFirst({
      where: eq(schema.muhurat.id, id),
    });
    if (!existing) {
      throw new NotFoundException('Muhurat entry not found');
    }

    if (role !== 'admin' && existing.createdBy !== userId) {
      throw new ForbiddenException('You do not have permission to delete this entry');
    }

    await this.db.delete(schema.muhurat).where(eq(schema.muhurat.id, id));
    this.realtime.broadcast('muhurat:deleted', { id });
  }
}
