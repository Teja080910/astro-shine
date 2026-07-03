import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class MandirPoojaService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.mandirPooja.findMany({ where: eq(schema.mandirPooja.isActive, true) }); }
  async findAllAdmin() { return this.db.query.mandirPooja.findMany(); }
  async findById(id: string) { return this.db.query.mandirPooja.findFirst({ where: eq(schema.mandirPooja.id, id) }); }

  async create(data: typeof schema.mandirPooja.$inferInsert) { const [r] = await this.db.insert(schema.mandirPooja).values(data).returning(); return r; }
  async update(id: string, data: Partial<typeof schema.mandirPooja.$inferInsert>) {
    const [r] = await this.db.update(schema.mandirPooja).set({ ...data, updatedAt: new Date() }).where(eq(schema.mandirPooja.id, id)).returning(); return r;
  }

  async getBookings(userId?: string, poojaId?: string) {
    if (userId) return this.db.query.poojaBookings.findMany({ where: eq(schema.poojaBookings.userId, userId) });
    if (poojaId) return this.db.query.poojaBookings.findMany({ where: eq(schema.poojaBookings.poojaId, poojaId) });
    return this.db.query.poojaBookings.findMany();
  }

  async createBooking(data: typeof schema.poojaBookings.$inferInsert) {
    const [r] = await this.db.insert(schema.poojaBookings).values(data).returning(); return r;
  }

  async updateBookingStatus(id: string, status: string) {
    const [r] = await this.db.update(schema.poojaBookings).set({ status, updatedAt: new Date() }).where(eq(schema.poojaBookings.id, id)).returning(); return r;
  }
}
