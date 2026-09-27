import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, desc, and, or, ilike, sql, SQL } from 'drizzle-orm';
import { parsePrice } from '../../common/utils/parse-price';
import { UUID_RE } from '../../common/utils/validation';
import {
  paginated,
  Pagination,
} from '../../common/utils/pagination';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MandirPoojaService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService,
  ) {}
  private buildSearch(q: string) {
    return or(
      ilike(schema.mandirPooja.name, `%${q}%`),
      ilike(schema.mandirPooja.description, `%${q}%`),
    );
  }

  async findAll(pagination?: Pagination) {
    const activeWhere = eq(schema.mandirPooja.isActive, true);
    const orderBy = [desc(schema.mandirPooja.createdAt)];

    if (!pagination?.enabled) {
      return this.db.query.mandirPooja.findMany({
        where: activeWhere,
        orderBy,
      });
    }

    const search = pagination.q ? this.buildSearch(pagination.q) : undefined;
    const where = search ? and(activeWhere, search) : activeWhere;
    const [rows, countRows] = await Promise.all([
      this.db.query.mandirPooja.findMany({
        where,
        orderBy,
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.mandirPooja)
        .where(where),
    ]);
    return paginated(rows, countRows[0]?.count ?? 0, pagination);
  }

  async findAllAdmin(pagination?: Pagination) {
    const orderBy = [desc(schema.mandirPooja.createdAt)];
    const search = pagination?.q ? this.buildSearch(pagination.q) : undefined;

    if (!pagination?.enabled) {
      return this.db.query.mandirPooja.findMany({ orderBy });
    }

    const [rows, countRows] = await Promise.all([
      this.db.query.mandirPooja.findMany({
        where: search,
        orderBy,
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.mandirPooja)
        .where(search),
    ]);
    return paginated(rows, countRows[0]?.count ?? 0, pagination);
  }
  async findById(id: string) {
    return this.db.query.mandirPooja.findFirst({
      where: eq(schema.mandirPooja.id, id),
    });
  }

  async create(data: any) {
    const name = String(data?.name ?? '').trim();
    if (!name) throw new BadRequestException('Pooja name is required');

    const payload = {
      name,
      description: data?.description ?? null,
      image: data?.image || null,
      price: parsePrice(data?.price),
      isActive: data?.isActive !== false,
    };

    const [r] = await this.db
      .insert(schema.mandirPooja)
      .values(payload)
      .returning();
    return r;
  }

  async update(id: string, data: any) {
    if (!UUID_RE.test(id)) throw new BadRequestException('Invalid pooja');

    const payload: Partial<typeof schema.mandirPooja.$inferInsert> = {};
    if (data?.name !== undefined) {
      const name = String(data.name).trim();
      if (!name) throw new BadRequestException('Pooja name is required');
      payload.name = name;
    }
    if (data?.description !== undefined)
      payload.description = data.description || null;
    if (data?.image !== undefined) payload.image = data.image || null;
    if (data?.price !== undefined) payload.price = parsePrice(data.price);
    if (data?.isActive !== undefined) payload.isActive = !!data.isActive;

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    const [r] = await this.db
      .update(schema.mandirPooja)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(schema.mandirPooja.id, id))
      .returning();
    if (!r) throw new NotFoundException('Pooja not found');
    return r;
  }

  async delete(id: string) {
    if (!UUID_RE.test(id)) throw new BadRequestException('Invalid pooja');
    const [r] = await this.db
      .delete(schema.mandirPooja)
      .where(eq(schema.mandirPooja.id, id))
      .returning({ id: schema.mandirPooja.id });
    if (!r) throw new NotFoundException('Pooja not found');
    return { success: true };
  }

  async getBookings(userId?: string, poojaId?: string, pagination?: Pagination) {
    const conditions: SQL[] = [];
    if (userId) conditions.push(eq(schema.poojaBookings.userId, userId));
    else if (poojaId) conditions.push(eq(schema.poojaBookings.poojaId, poojaId));
    if (pagination?.q)
      conditions.push(
        or(
          ilike(schema.poojaBookings.status, `%${pagination.q}%`),
          ilike(schema.mandirPooja.name, `%${pagination.q}%`),
          ilike(schema.users.name, `%${pagination.q}%`),
        )!,
      );
    const where = conditions.length ? and(...conditions) : undefined;

    const selectFields = {
      id: schema.poojaBookings.id,
      userId: schema.poojaBookings.userId,
      userName: schema.users.name,
      userEmail: schema.users.email,
      userPhone: schema.users.phone,
      poojaId: schema.poojaBookings.poojaId,
      poojaName: schema.mandirPooja.name,
      poojaDescription: schema.mandirPooja.description,
      poojaImage: schema.mandirPooja.image,
      poojaPrice: schema.mandirPooja.price,
      bookingDate: schema.poojaBookings.bookingDate,
      amount: schema.poojaBookings.amount,
      transactionId: schema.poojaBookings.transactionId,
      transactionReference: schema.transactions.referenceId,
      status: schema.poojaBookings.status,
      notes: schema.poojaBookings.notes,
      createdAt: schema.poojaBookings.createdAt,
      updatedAt: schema.poojaBookings.updatedAt,
    };

    if (!pagination?.enabled) {
      return this.db
        .select(selectFields)
        .from(schema.poojaBookings)
        .leftJoin(schema.mandirPooja, eq(schema.poojaBookings.poojaId, schema.mandirPooja.id))
        .leftJoin(schema.users, eq(schema.poojaBookings.userId, schema.users.id))
        .leftJoin(schema.transactions, eq(schema.poojaBookings.transactionId, schema.transactions.id))
        .where(where)
        .orderBy(desc(schema.poojaBookings.createdAt));
    }

    const [rows, countRows] = await Promise.all([
      this.db
        .select(selectFields)
        .from(schema.poojaBookings)
        .leftJoin(schema.mandirPooja, eq(schema.poojaBookings.poojaId, schema.mandirPooja.id))
        .leftJoin(schema.users, eq(schema.poojaBookings.userId, schema.users.id))
        .leftJoin(schema.transactions, eq(schema.poojaBookings.transactionId, schema.transactions.id))
        .where(where)
        .orderBy(desc(schema.poojaBookings.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.poojaBookings)
        .leftJoin(schema.mandirPooja, eq(schema.poojaBookings.poojaId, schema.mandirPooja.id))
        .leftJoin(schema.users, eq(schema.poojaBookings.userId, schema.users.id))
        .where(where),
    ]);
    return paginated(rows, countRows[0]?.count ?? 0, pagination);
  }

  async getBookingById(id: string) {
    const [booking] = await this.db
      .select({
        id: schema.poojaBookings.id,
        userId: schema.poojaBookings.userId,
        userName: schema.users.name,
        userEmail: schema.users.email,
        userPhone: schema.users.phone,
        poojaId: schema.poojaBookings.poojaId,
        poojaName: schema.mandirPooja.name,
        poojaDescription: schema.mandirPooja.description,
        poojaImage: schema.mandirPooja.image,
        poojaPrice: schema.mandirPooja.price,
        bookingDate: schema.poojaBookings.bookingDate,
        amount: schema.poojaBookings.amount,
        transactionId: schema.poojaBookings.transactionId,
        transactionReference: schema.transactions.referenceId,
        status: schema.poojaBookings.status,
        notes: schema.poojaBookings.notes,
        createdAt: schema.poojaBookings.createdAt,
        updatedAt: schema.poojaBookings.updatedAt,
      })
      .from(schema.poojaBookings)
      .leftJoin(schema.mandirPooja, eq(schema.poojaBookings.poojaId, schema.mandirPooja.id))
      .leftJoin(schema.users, eq(schema.poojaBookings.userId, schema.users.id))
      .leftJoin(schema.transactions, eq(schema.poojaBookings.transactionId, schema.transactions.id))
      .where(eq(schema.poojaBookings.id, id));
    return booking || null;
  }

  async createBooking(data: typeof schema.poojaBookings.$inferInsert) {
    const [r] = await this.db
      .insert(schema.poojaBookings)
      .values(data)
      .returning();
    return r;
  }

  async updateBookingStatus(id: string, status: string) {
    const [r] = await this.db
      .update(schema.poojaBookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.poojaBookings.id, id))
      .returning();

    if (r) {
      try {
        const pooja = await this.db.query.mandirPooja.findFirst({
          where: eq(schema.mandirPooja.id, r.poojaId),
        });
        const poojaName = pooja?.name || 'Mandir Puja';

        let title = `Puja Status Updated: ${status.toUpperCase()}`;
        let body = `Your booking for ${poojaName} has been marked as ${status}.`;

        if (status === 'completed') {
          title = `Puja Completed! 🙏✨`;
          body = `The sacred rituals for ${poojaName} have been completed by the temple priests. May you be blessed with peace, health, and prosperity!`;
        } else if (status === 'confirmed') {
          title = `Puja Confirmed! 🕉️`;
          body = `Your booking for ${poojaName} on ${r.bookingDate} is confirmed. Our temple priests will perform the rituals.`;
        } else if (status === 'cancelled') {
          title = `Puja Booking Cancelled`;
          body = `Your booking for ${poojaName} has been cancelled.`;
        }

        await this.notificationsService.create({
          userId: r.userId,
          type: 'transactional',
          title,
          body,
          data: {
            type: 'pooja_booking',
            bookingId: r.id,
            poojaId: r.poojaId,
            status,
          },
        });
      } catch (err) {
        console.error('Failed to send status update notification:', err);
      }
    }
    return r;
  }
}
