import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, sql } from 'drizzle-orm';

@Injectable()
export class WalletService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db
      .select()
      .from(schema.wallets)
      .orderBy(sql`${schema.wallets.createdAt} DESC`);
  }

  async getWalletByUserId(userId: string) {
    const [wallet] = await this.db
      .select()
      .from(schema.wallets)
      .where(eq(schema.wallets.userId, userId))
      .limit(1);
    return wallet;
  }

  async getWalletByAstrologerId(astrologerId: string) {
    const [wallet] = await this.db
      .select()
      .from(schema.wallets)
      .where(eq(schema.wallets.astrologerId, astrologerId))
      .limit(1);
    return wallet;
  }

  async getWalletByAdminId(adminId: string) {
    const [wallet] = await this.db
      .select()
      .from(schema.wallets)
      .where(eq(schema.wallets.adminId, adminId))
      .limit(1);
    return wallet;
  }

  async getOrCreateAdminWallet(): Promise<{ id: string; balance: string }> {
    const [admin] = await this.db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.isActive, true))
      .limit(1);
    if (!admin) throw new NotFoundException('No active admin found');
    let wallet = await this.getWalletByAdminId(admin.id);
    if (!wallet) {
      const [created] = await this.db.insert(schema.wallets).values({
        adminId: admin.id,
      }).returning();
      wallet = created;
    }
    return wallet;
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

  async creditPlatformFee(amount: number, description: string, referenceId?: string): Promise<void> {
    const adminWallet = await this.getOrCreateAdminWallet();
    const amountStr = amount.toFixed(2);
    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.wallets)
        .set({
          balance: sql`${schema.wallets.balance} + ${amountStr}::decimal`,
          totalAdded: sql`${schema.wallets.totalAdded} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.wallets.id, adminWallet.id));
      await tx.insert(schema.transactions).values({
        walletId: adminWallet.id,
        type: 'credit',
        category: 'commission',
        amount: amountStr,
        fee: '0',
        netAmount: amountStr,
        status: 'success',
        description,
        referenceId: referenceId || null,
      });
    });
  }

  async checkSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const wallet = await this.getWalletByUserId(userId);
    if (!wallet) return false;
    return Number(wallet.balance) >= amount;
  }

  async deductFundsAtomic(params: {
    userId?: string;
    astrologerId?: string;
    amount: number;
    description: string;
    category: string;
    referenceId?: string;
  }): Promise<void> {
    const { userId, astrologerId, amount, description, category, referenceId } = params;

    await this.db.transaction(async (tx) => {
      // Idempotency check: if a transaction with this referenceId + category already exists, skip
      if (referenceId) {
        const [existing] = await tx
          .select()
          .from(schema.transactions)
          .where(and(eq(schema.transactions.referenceId, referenceId), eq(schema.transactions.category, category as any)))
          .limit(1);
        if (existing) {
          return;
        }
      }

      let wallet;
      if (userId) {
        const result = await tx.execute<{
          id: string; user_id: string; astrologer_id: string | null;
          balance: string; total_added: string; total_deducted: string;
        }>(sql`SELECT id, user_id, astrologer_id, balance, total_added, total_deducted
          FROM wallets WHERE user_id = ${userId} LIMIT 1 FOR UPDATE`);
        wallet = result.rows?.[0] ? {
          id: result.rows[0].id,
          userId: result.rows[0].user_id,
          astrologerId: result.rows[0].astrologer_id,
          balance: result.rows[0].balance,
          totalAdded: result.rows[0].total_added,
          totalDeducted: result.rows[0].total_deducted,
        } : null;
      } else if (astrologerId) {
        const result = await tx.execute<{
          id: string; user_id: string | null; astrologer_id: string;
          balance: string; total_added: string; total_deducted: string;
        }>(sql`SELECT id, user_id, astrologer_id, balance, total_added, total_deducted
          FROM wallets WHERE astrologer_id = ${astrologerId} LIMIT 1 FOR UPDATE`);
        wallet = result.rows?.[0] ? {
          id: result.rows[0].id,
          userId: result.rows[0].user_id,
          astrologerId: result.rows[0].astrologer_id,
          balance: result.rows[0].balance,
          totalAdded: result.rows[0].total_added,
          totalDeducted: result.rows[0].total_deducted,
        } : null;
      }

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (Number(wallet.balance) < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const amountStr = amount.toFixed(2);

      await tx
        .update(schema.wallets)
        .set({
          balance: sql`${schema.wallets.balance} - ${amountStr}::decimal`,
          totalDeducted: sql`${schema.wallets.totalDeducted} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.wallets.id, wallet.id));

      await tx.insert(schema.transactions).values({
        walletId: wallet.id,
        userId: userId || null,
        astrologerId: astrologerId || null,
        type: 'debit',
        category: category as any,
        amount: amountStr,
        fee: '0',
        netAmount: amountStr,
        status: 'success',
        description,
        referenceId: referenceId || null,
      });
    });
  }

  async creditFunds(params: {
    userId?: string;
    astrologerId?: string;
    amount: number;
    description: string;
    category: string;
    referenceId?: string;
  }): Promise<void> {
    const { userId, astrologerId, amount, description, category, referenceId } = params;

    await this.db.transaction(async (tx) => {
      // Idempotency check: if a transaction with this referenceId + category already exists, skip
      if (referenceId) {
        const [existing] = await tx
          .select()
          .from(schema.transactions)
          .where(and(eq(schema.transactions.referenceId, referenceId), eq(schema.transactions.category, category as any)))
          .limit(1);
        if (existing) {
          return;
        }
      }

      let wallet;
      if (userId) {
        const result = await tx.execute<{
          id: string; user_id: string; astrologer_id: string | null;
          balance: string; total_added: string; total_deducted: string;
        }>(sql`SELECT id, user_id, astrologer_id, balance, total_added, total_deducted
          FROM wallets WHERE user_id = ${userId} LIMIT 1 FOR UPDATE`);
        wallet = result.rows?.[0] ? {
          id: result.rows[0].id,
          userId: result.rows[0].user_id,
          astrologerId: result.rows[0].astrologer_id,
          balance: result.rows[0].balance,
          totalAdded: result.rows[0].total_added,
          totalDeducted: result.rows[0].total_deducted,
        } : null;
      } else if (astrologerId) {
        const result = await tx.execute<{
          id: string; user_id: string | null; astrologer_id: string;
          balance: string; total_added: string; total_deducted: string;
        }>(sql`SELECT id, user_id, astrologer_id, balance, total_added, total_deducted
          FROM wallets WHERE astrologer_id = ${astrologerId} LIMIT 1 FOR UPDATE`);
        wallet = result.rows?.[0] ? {
          id: result.rows[0].id,
          userId: result.rows[0].user_id,
          astrologerId: result.rows[0].astrologer_id,
          balance: result.rows[0].balance,
          totalAdded: result.rows[0].total_added,
          totalDeducted: result.rows[0].total_deducted,
        } : null;
      }

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const amountStr = amount.toFixed(2);

      await tx
        .update(schema.wallets)
        .set({
          balance: sql`${schema.wallets.balance} + ${amountStr}::decimal`,
          totalAdded: sql`${schema.wallets.totalAdded} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.wallets.id, wallet.id));

      await tx.insert(schema.transactions).values({
        walletId: wallet.id,
        userId: userId || null,
        astrologerId: astrologerId || null,
        type: 'credit',
        category: category as any,
        amount: amountStr,
        fee: '0',
        netAmount: amountStr,
        status: 'success',
        description,
        referenceId: referenceId || null,
      });
    });
  }
}
