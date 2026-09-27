import {
  Injectable,
  Inject,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, ne, gte, lte, asc, or, ilike, sql, SQL } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { AstrologyService } from '../astrology/astrology.service';
import {
  paginated,
  Pagination,
} from '../../common/utils/pagination';

const AUSPICIOUS_CHAUGHADIYA = ['Labh', 'Amrit', 'Shubh'];
const MAX_RANGE_DAYS = 31;
const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.209;
const DEFAULT_TZ = 5.5;

const pad = (n: number) => String(n).padStart(2, '0');

const formatDateString = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parseDateString = (value?: string | null): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value || '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

const normalizeTimeString = (value?: string | null): string => {
  const match = /(\d+)\s*:\s*(\d+)(?:\s*:\s*(\d+))?/.exec((value || '').trim());
  if (!match) return '';
  return `${pad(Number(match[1]))}:${pad(Number(match[2]))}:${pad(
    Number(match[3] || 0),
  )}`;
};

@Injectable()
export class MuhuratService {
  private readonly logger = new Logger(MuhuratService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
    private readonly astrology: AstrologyService,
  ) {}

  async enrichEntry(entry: any) {
    if (!entry) return null;
    const cat = await this.db.query.muhuratCategories.findFirst({
      where: eq(schema.muhuratCategories.id, entry.categoryId),
    });

    let createdByName = 'System';
    if (entry.createdBy) {
      const astrologer = await this.db.query.astrologers.findFirst({
        where: eq(schema.astrologers.userId, entry.createdBy),
      });
      if (astrologer) {
        const astroUser = await this.db.query.users.findFirst({
          where: eq(schema.users.id, entry.createdBy),
        });
        createdByName = astroUser?.name || 'Astrologer';
      } else {
        const admin = await this.db.query.admins.findFirst({
          where: eq(schema.admins.userId, entry.createdBy),
        });
        if (admin) {
          const adminUser = await this.db.query.users.findFirst({
            where: eq(schema.users.id, entry.createdBy),
          });
          createdByName = adminUser?.name || 'Admin';
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

  private resolveRange(startDate?: string, endDate?: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let start = parseDateString(startDate) || today;
    let end = parseDateString(endDate);
    if (!end) {
      end = new Date(start);
      end.setDate(end.getDate() + 3);
    }

    if (end < start) {
      const tmp = start;
      start = end;
      end = tmp;
    }

    const maxEnd = new Date(start);
    maxEnd.setDate(maxEnd.getDate() + MAX_RANGE_DAYS - 1);
    if (end > maxEnd) end = maxEnd;

    return { start, end };
  }

  async ensureGeneratedForRange(start: Date, end: Date) {
    const startStr = formatDateString(start);
    const endStr = formatDateString(end);

    const [categories, existing] = await Promise.all([
      this.db.query.muhuratCategories.findMany(),
      this.db
        .select({
          date: schema.muhurat.date,
          categoryId: schema.muhurat.categoryId,
        })
        .from(schema.muhurat)
        .where(
          and(
            gte(schema.muhurat.date, startStr),
            lte(schema.muhurat.date, endStr),
          ),
        ),
    ]);

    const chaughadiyaCat = categories.find(
      (c) =>
        c.name === 'Chaughadiya Muhurat' || c.name === 'Choghadiya Muhurat',
    )?.id;
    const abhijitCat = categories.find((c) => c.name === 'Abhijit Muhurat')?.id;
    if (!chaughadiyaCat && !abhijitCat) return;

    const covered = new Set(existing.map((e) => `${e.categoryId}:${e.date}`));
    const rows: (typeof schema.muhurat.$inferInsert)[] = [];

    for (
      const cursor = new Date(start);
      cursor <= end;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const date = formatDateString(cursor);

      if (chaughadiyaCat && !covered.has(`${chaughadiyaCat}:${date}`)) {
        try {
          const chaughadiya = await this.astrology.getChaughadiyaMuhurta(
            date,
            DEFAULT_LAT,
            DEFAULT_LNG,
            DEFAULT_TZ,
          );
          const slots = chaughadiya?.chaughadiya?.day || [];
          for (const slot of slots) {
            if (!AUSPICIOUS_CHAUGHADIYA.includes(slot.muhurta)) continue;
            const time = normalizeTimeString(slot.time);
            if (!time) continue;
            rows.push({
              categoryId: chaughadiyaCat,
              name: `${slot.muhurta} Choghadiya`,
              date,
              time,
              description: `Auspicious ${slot.muhurta} choghadiya period. Good for starting new ventures.`,
            });
          }
        } catch (e) {
          this.logger.warn(
            `Chaughadiya generation failed for ${date}: ${(e as Error)?.message}`,
          );
        }
      }

      if (abhijitCat && !covered.has(`${abhijitCat}:${date}`)) {
        try {
          const panchang = await this.astrology.calculatePanchang(
            date,
            DEFAULT_LAT,
            DEFAULT_LNG,
            DEFAULT_TZ,
          );
          const abhijit = panchang?.abhijitMuhurta;
          const time = normalizeTimeString(abhijit?.start);
          if (time) {
            rows.push({
              categoryId: abhijitCat,
              name: 'Abhijit Muhurat',
              date,
              time,
              description: `Auspicious midday muhurat ${abhijit?.start} - ${abhijit?.end}. Ideal for starting new ventures.`,
            });
          }
        } catch (e) {
          this.logger.warn(
            `Abhijit generation failed for ${date}: ${(e as Error)?.message}`,
          );
        }
      }
    }

    if (rows.length) {
      await this.db.insert(schema.muhurat).values(rows).onConflictDoNothing();
    }
  }

  private buildSearch(q: string): SQL {
    return or(
      ilike(schema.muhurat.name, `%${q}%`),
      sql`${schema.muhurat.date}::text ILIKE ${`%${q}%`}`,
      sql`(CASE WHEN ${schema.muhurat.isActive} THEN 'Active' ELSE 'Inactive' END) ILIKE ${`%${q}%`}`,
    )!;
  }

  async findAll(
    categoryId?: string,
    startDate?: string,
    endDate?: string,
    pagination?: Pagination,
  ) {
    const { start, end } = this.resolveRange(startDate, endDate);

    try {
      await this.ensureGeneratedForRange(start, end);
    } catch (e) {
      this.logger.warn(`Muhurat generation skipped: ${(e as Error)?.message}`);
    }

    const conditions: SQL[] = [eq(schema.muhurat.isActive, true)];
    if (categoryId) {
      conditions.push(eq(schema.muhurat.categoryId, categoryId));
    }
    conditions.push(gte(schema.muhurat.date, formatDateString(start)));
    conditions.push(lte(schema.muhurat.date, formatDateString(end)));
    if (pagination?.q) {
      conditions.push(this.buildSearch(pagination.q));
    }

    const where = and(...conditions);
    const orderBy = [asc(schema.muhurat.date), asc(schema.muhurat.time)];

    if (!pagination?.enabled) {
      const entries = await this.db.query.muhurat.findMany({
        where,
        orderBy,
      });
      return this.enrichEntries(entries);
    }

    const [entries, countRows] = await Promise.all([
      this.db.query.muhurat.findMany({
        where,
        orderBy,
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.muhurat)
        .where(where),
    ]);
    const enriched = await this.enrichEntries(entries);
    return paginated(enriched, countRows[0]?.count ?? 0, pagination);
  }

  async findAllAdmin(pagination?: Pagination) {
    const orderBy = [asc(schema.muhurat.date), asc(schema.muhurat.time)];
    const where = pagination?.q ? this.buildSearch(pagination.q) : undefined;

    if (!pagination?.enabled) {
      const entries = await this.db.query.muhurat.findMany({ orderBy });
      return this.enrichEntries(entries);
    }

    const [entries, countRows] = await Promise.all([
      this.db.query.muhurat.findMany({
        where,
        orderBy,
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.muhurat)
        .where(where),
    ]);
    const enriched = await this.enrichEntries(entries);
    return paginated(enriched, countRows[0]?.count ?? 0, pagination);
  }

  async findMyEntries(userId: string) {
    const entries = await this.db.query.muhurat.findMany({
      where: eq(schema.muhurat.createdBy, userId),
      orderBy: [asc(schema.muhurat.date), asc(schema.muhurat.time)],
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
      throw new ConflictException(
        `This time slot is already registered by ${name}`,
      );
    }
  }

  async create(data: typeof schema.muhurat.$inferInsert) {
    await this.checkConflict(data.date, data.time);
    const [r] = await this.db.insert(schema.muhurat).values(data).returning();
    const enriched = await this.enrichEntry(r);
    this.realtime.broadcast('muhurat:created', enriched);
    return enriched;
  }

  async update(
    id: string,
    data: Partial<typeof schema.muhurat.$inferInsert>,
    userId: string | null,
    role: string,
  ) {
    const existing = await this.db.query.muhurat.findFirst({
      where: eq(schema.muhurat.id, id),
    });
    if (!existing) {
      throw new NotFoundException('Muhurat entry not found');
    }

    if (role !== 'admin' && existing.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this entry',
      );
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
      throw new ForbiddenException(
        'You do not have permission to delete this entry',
      );
    }

    await this.db.delete(schema.muhurat).where(eq(schema.muhurat.id, id));
    this.realtime.broadcast('muhurat:deleted', { id });
  }
}
