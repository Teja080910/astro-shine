import { Injectable, Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, sql, aliasedTable } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';

@Injectable()
export class GiftsService {
  private readonly logger = new Logger(GiftsService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
  ) {}

  async findAll() { return this.db.query.gifts.findMany(); }
  async findById(id: string) { return this.db.query.gifts.findFirst({ where: eq(schema.gifts.id, id) }); }
  async create(data: typeof schema.gifts.$inferInsert) {
    const [r] = await this.db.insert(schema.gifts).values(data).returning();
    this.realtime.broadcast('gift:created', r);
    return r;
  }
  async update(id: string, data: Partial<typeof schema.gifts.$inferInsert>) {
    const [r] = await this.db.update(schema.gifts).set(data).where(eq(schema.gifts.id, id)).returning();
    this.realtime.broadcast('gift:updated', r);
    return r;
  }
  async delete(id: string) {
    await this.db.delete(schema.gifts).where(eq(schema.gifts.id, id));
    this.realtime.broadcast('gift:deleted', { id });
    return { success: true };
  }

  async getGiftTransactions(userId?: string) {
    const senderUser = aliasedTable(schema.users, 'sender_user');
    const receiverUser = aliasedTable(schema.users, 'receiver_user');

    const base = this.db
      .select({
        id: schema.giftTransactions.id,
        giftId: schema.giftTransactions.giftId,
        senderId: schema.giftTransactions.senderId,
        receiverId: schema.giftTransactions.receiverId,
        transactionId: schema.giftTransactions.transactionId,
        isRedeemed: schema.giftTransactions.isRedeemed,
        redeemedAt: schema.giftTransactions.redeemedAt,
        createdAt: schema.giftTransactions.createdAt,
        senderName: senderUser.name,
        receiverName: receiverUser.name,
      })
      .from(schema.giftTransactions)
      .leftJoin(senderUser, eq(senderUser.id, schema.giftTransactions.senderId))
      .leftJoin(schema.astrologers, eq(schema.astrologers.userId, schema.giftTransactions.receiverId))
      .leftJoin(receiverUser, eq(receiverUser.id, schema.astrologers.userId));

    if (userId) {
      return base.where(eq(schema.giftTransactions.senderId, userId));
    }
    return base;
  }

  async sendGift(data: { giftId: string; senderId: string; receiverId: string }) {
    const gift = await this.findById(data.giftId);
    if (!gift || !gift.isActive) throw new NotFoundException('Gift not found or inactive');
    const amount = parseFloat(gift.price);
    if (amount <= 0) throw new BadRequestException('Invalid gift price');
    const amountStr = amount.toFixed(2);

    await this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(schema.giftTransactions)
        .where(eq(schema.giftTransactions.giftId, data.giftId))
        .limit(1);
      if (existing) {
        throw new BadRequestException('This gift has already been sent');
      }

      // Lock and deduct sender wallet
      const senderWallet = (await tx.execute<{ id: string; balance: string }>(
        sql`SELECT id, balance FROM wallets WHERE user_id = ${data.senderId} LIMIT 1 FOR UPDATE`
      )).rows?.[0];
      if (!senderWallet) throw new NotFoundException('Sender wallet not found');
      if (Number(senderWallet.balance) < amount) throw new BadRequestException('Insufficient wallet balance');

      await tx
        .update(schema.wallets)
        .set({
          balance: sql`${schema.wallets.balance} - ${amountStr}::decimal`,
          totalDeducted: sql`${schema.wallets.totalDeducted} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.wallets.id, senderWallet.id));

      await tx.insert(schema.transactions).values({
        walletId: senderWallet.id,
        userId: data.senderId,
        type: 'debit',
        category: 'gift',
        amount: amountStr,
        fee: '0',
        netAmount: amountStr,
        status: 'success',
        description: `Gift sent: ${gift.name}`,
        referenceId: data.giftId,
      });

      // Lock and credit astrologer wallet
      let astroWallet = (await tx.execute<{ id: string; balance: string }>(
        sql`SELECT id, balance FROM wallets WHERE astrologer_id = ${data.receiverId} LIMIT 1 FOR UPDATE`
      )).rows?.[0];
      if (!astroWallet) {
        const [created] = await tx.insert(schema.wallets).values({
          astrologerId: data.receiverId,
        }).returning({ id: schema.wallets.id, balance: schema.wallets.balance });
        astroWallet = created;
      }

      await tx
        .update(schema.wallets)
        .set({
          balance: sql`${schema.wallets.balance} + ${amountStr}::decimal`,
          totalAdded: sql`${schema.wallets.totalAdded} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.wallets.id, astroWallet.id));

      await tx.insert(schema.transactions).values({
        walletId: astroWallet.id,
        astrologerId: data.receiverId,
        type: 'credit',
        category: 'gift',
        amount: amountStr,
        fee: '0',
        netAmount: amountStr,
        status: 'success',
        description: `Gift received: ${gift.name}`,
        referenceId: data.giftId,
      });

      await tx.insert(schema.giftTransactions).values({
        giftId: data.giftId,
        senderId: data.senderId,
        receiverId: data.receiverId,
      });

      await tx
        .update(schema.astrologers)
        .set({
          totalEarnings: sql`${schema.astrologers.totalEarnings} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.astrologers.userId, data.receiverId));
    });

    // Emit wallet updates outside transaction
    const updatedSenderBalance = (Number((await this.db
      .select({ balance: schema.wallets.balance })
      .from(schema.wallets)
      .where(eq(schema.wallets.userId, data.senderId))
      .limit(1))[0]?.balance || 0)).toFixed(2);
    const updatedAstroBalance = (Number((await this.db
      .select({ balance: schema.wallets.balance })
      .from(schema.wallets)
      .where(eq(schema.wallets.astrologerId, data.receiverId))
      .limit(1))[0]?.balance || 0)).toFixed(2);

    this.realtime.emitToUser(data.senderId, 'wallet:updated', { balance: updatedSenderBalance });
    this.realtime.emitToUser(data.receiverId, 'wallet:updated', { balance: updatedAstroBalance });
    this.realtime.emitToUser(data.receiverId, 'gift:sent', { giftId: data.giftId, senderId: data.senderId, receiverId: data.receiverId });

    this.logger.log(`Gift ${data.giftId} sent from ${data.senderId} to ${data.receiverId} (${amountStr})`);
    return { success: true, message: `Gift sent successfully`, amount: amountStr };
  }

  async redeemGift(id: string) {
    const txn = await this.db.query.giftTransactions.findFirst({ where: eq(schema.giftTransactions.id, id) });
    if (!txn) throw new NotFoundException('Gift transaction not found');
    if (txn.isRedeemed) return { success: true, message: 'Already redeemed' };

    const [r] = await this.db.update(schema.giftTransactions)
      .set({ isRedeemed: true, redeemedAt: new Date() })
      .where(eq(schema.giftTransactions.id, id))
      .returning();
    return r;
  }
}
