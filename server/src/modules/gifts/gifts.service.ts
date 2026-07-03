import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class GiftsService {
  constructor(@Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>) {}

  async findAll() { return this.db.query.gifts.findMany(); }
  async findById(id: string) { return this.db.query.gifts.findFirst({ where: eq(schema.gifts.id, id) }); }
  async create(data: typeof schema.gifts.$inferInsert) { const [r] = await this.db.insert(schema.gifts).values(data).returning(); return r; }

  async getGiftTransactions(userId?: string) {
    if (userId) return this.db.query.giftTransactions.findMany({ where: eq(schema.giftTransactions.senderId, userId) });
    return this.db.query.giftTransactions.findMany();
  }

  async sendGift(data: typeof schema.giftTransactions.$inferInsert) {
    const [r] = await this.db.insert(schema.giftTransactions).values(data).returning(); return r;
  }

  async redeemGift(id: string) {
    const [r] = await this.db.update(schema.giftTransactions).set({ isRedeemed: true, redeemedAt: new Date() }).where(eq(schema.giftTransactions.id, id)).returning(); return r;
  }
}
