import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class WalletService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  async getWalletByUserId(userId: string) {
    return this.db.query.wallets.findFirst({
      where: eq(schema.wallets.userId, userId),
    });
  }

  async getWalletByAstrologerId(astrologerId: string) {
    return this.db.query.wallets.findFirst({
      where: eq(schema.wallets.astrologerId, astrologerId),
    });
  }

  async createWallet(data: { userId?: string; astrologerId?: string }) {
    const [wallet] = await this.db
      .insert(schema.wallets)
      .values({
        userId: data.userId,
        astrologerId: data.astrologerId,
        balance: '0',
        totalAdded: '0',
        totalDeducted: '0',
      })
      .returning();
    return wallet;
  }

  async addFunds(walletId: string, amount: string) {
    const [wallet] = await this.db
      .update(schema.wallets)
      .set({
        balance: sql`${schema.wallets.balance} + ${amount}::decimal`,
        totalAdded: sql`${schema.wallets.totalAdded} + ${amount}::decimal`,
        updatedAt: new Date(),
      })
      .where(eq(schema.wallets.id, walletId))
      .returning();
    return wallet;
  }

  async deductFunds(walletId: string, amount: string) {
    const [wallet] = await this.db
      .update(schema.wallets)
      .set({
        balance: sql`${schema.wallets.balance} - ${amount}::decimal`,
        totalDeducted: sql`${schema.wallets.totalDeducted} + ${amount}::decimal`,
        updatedAt: new Date(),
      })
      .where(eq(schema.wallets.id, walletId))
      .returning();
    return wallet;
  }
}
