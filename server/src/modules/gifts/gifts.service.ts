import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, sql, aliasedTable, desc, ilike } from 'drizzle-orm';
import { RealtimeService } from '../../common/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { parsePrice } from '../../common/utils/parse-price';
import { UUID_RE } from '../../common/utils/validation';
import {
  paginated,
  Pagination,
} from '../../common/utils/pagination';

@Injectable()
export class GiftsService {
  private readonly logger = new Logger(GiftsService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(pagination?: Pagination) {
    const where = pagination?.q
      ? ilike(schema.gifts.name, `%${pagination.q}%`)
      : undefined;

    if (!pagination?.enabled) {
      return this.db.query.gifts.findMany({
        where,
        orderBy: [desc(schema.gifts.createdAt)],
      });
    }

    const [data, countRows] = await Promise.all([
      this.db.query.gifts.findMany({
        where,
        orderBy: [desc(schema.gifts.createdAt)],
        limit: pagination.limit,
        offset: pagination.offset,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.gifts)
        .where(where),
    ]);
    return paginated(data, Number(countRows[0]?.count || 0), pagination);
  }
  async findById(id: string) {
    return this.db.query.gifts.findFirst({ where: eq(schema.gifts.id, id) });
  }
  async create(data: any) {
    const name = String(data?.name ?? '').trim();
    if (!name) throw new BadRequestException('Gift name is required');

    const payload = {
      name,
      image: data?.image || null,
      price: parsePrice(data?.price),
      isActive: data?.isActive !== false,
    };

    const [r] = await this.db.insert(schema.gifts).values(payload).returning();
    this.realtime.broadcast('gift:created', r);
    return r;
  }
  async update(id: string, data: any) {
    if (!UUID_RE.test(id)) throw new BadRequestException('Invalid gift');

    const payload: Partial<typeof schema.gifts.$inferInsert> = {};
    if (data?.name !== undefined) {
      const name = String(data.name).trim();
      if (!name) throw new BadRequestException('Gift name is required');
      payload.name = name;
    }
    if (data?.price !== undefined) payload.price = parsePrice(data.price);
    if (data?.image !== undefined) payload.image = data.image || null;
    if (data?.isActive !== undefined) payload.isActive = !!data.isActive;

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    const [r] = await this.db
      .update(schema.gifts)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(schema.gifts.id, id))
      .returning();
    if (!r) throw new NotFoundException('Gift not found');
    this.realtime.broadcast('gift:updated', r);
    return r;
  }
  async delete(id: string) {
    if (!UUID_RE.test(id)) throw new BadRequestException('Invalid gift');
    const [r] = await this.db
      .delete(schema.gifts)
      .where(eq(schema.gifts.id, id))
      .returning({ id: schema.gifts.id });
    if (!r) throw new NotFoundException('Gift not found');
    this.realtime.broadcast('gift:deleted', { id });
    return { success: true };
  }

  async getGiftTransactions(
    requesterId: string,
    role: string,
    userId?: string,
    pagination?: Pagination,
  ) {
    const senderUser = aliasedTable(schema.users, 'sender_user');
    const receiverUser = aliasedTable(schema.users, 'receiver_user');

    const where =
      role === 'admin'
        ? userId
          ? eq(schema.giftTransactions.senderId, userId)
          : undefined
        : role === 'astrologer'
          ? eq(schema.giftTransactions.receiverId, requesterId)
          : eq(schema.giftTransactions.senderId, requesterId);

    const build = () =>
      this.db
        .select({
          id: schema.giftTransactions.id,
          giftId: schema.giftTransactions.giftId,
          senderId: schema.giftTransactions.senderId,
          receiverId: schema.giftTransactions.receiverId,
          transactionId: schema.giftTransactions.transactionId,
          isRedeemed: schema.giftTransactions.isRedeemed,
          redeemedAt: schema.giftTransactions.redeemedAt,
          createdAt: schema.giftTransactions.createdAt,
          giftName: schema.gifts.name,
          giftImage: schema.gifts.image,
          senderName: senderUser.name,
          receiverName: receiverUser.name,
        })
        .from(schema.giftTransactions)
        .leftJoin(senderUser, eq(senderUser.id, schema.giftTransactions.senderId))
        .leftJoin(
          schema.astrologers,
          eq(schema.astrologers.userId, schema.giftTransactions.receiverId),
        )
        .leftJoin(receiverUser, eq(receiverUser.id, schema.astrologers.userId))
        .leftJoin(schema.gifts, eq(schema.gifts.id, schema.giftTransactions.giftId))
        .where(where)
        .orderBy(desc(schema.giftTransactions.createdAt));

    if (!pagination?.enabled) {
      return build();
    }

    const [data, countRows] = await Promise.all([
      build().limit(pagination.limit).offset(pagination.offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.giftTransactions)
        .where(where),
    ]);
    return paginated(data, Number(countRows[0]?.count || 0), pagination);
  }

  async sendGift(data: {
    giftId: string;
    senderId: string;
    receiverId: string;
  }) {
    const { giftId, senderId, receiverId } = data;

    if (!senderId || !UUID_RE.test(senderId)) {
      throw new BadRequestException('Invalid sender');
    }
    if (!receiverId || !UUID_RE.test(receiverId)) {
      throw new BadRequestException('Invalid receiver');
    }
    if (!giftId || !UUID_RE.test(giftId)) {
      throw new BadRequestException('Invalid gift');
    }
    if (senderId === receiverId) {
      throw new BadRequestException('You cannot send a gift to yourself');
    }

    const gift = await this.findById(giftId);
    if (!gift || !gift.isActive)
      throw new NotFoundException('Gift not found or inactive');
    const amount = parseFloat(gift.price);
    if (!Number.isFinite(amount) || amount <= 0)
      throw new BadRequestException('Invalid gift price');
    const amountStr = amount.toFixed(2);

    const receiver = await this.db.query.astrologers.findFirst({
      where: eq(schema.astrologers.userId, receiverId),
    });
    if (!receiver) throw new NotFoundException('Astrologer not found');

    await this.db.transaction(async (tx) => {
      // Lock and deduct sender wallet
      const senderWallet = (
        await tx.execute<{ id: string; balance: string }>(
          sql`SELECT id, balance FROM wallets WHERE user_id = ${senderId} LIMIT 1 FOR UPDATE`,
        )
      ).rows?.[0];
      if (!senderWallet) throw new NotFoundException('Sender wallet not found');
      if (Number(senderWallet.balance) < amount)
        throw new BadRequestException('Insufficient wallet balance');

      await tx
        .update(schema.wallets)
        .set({
          balance: sql`${schema.wallets.balance} - ${amountStr}::decimal`,
          totalDeducted: sql`${schema.wallets.totalDeducted} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.wallets.id, senderWallet.id));

      const [debitTxn] = await tx
        .insert(schema.transactions)
        .values({
          walletId: senderWallet.id,
          userId: senderId,
          type: 'debit',
          category: 'gift',
          amount: amountStr,
          fee: '0',
          netAmount: amountStr,
          status: 'success',
          description: `Gift sent: ${gift.name}`,
          referenceId: giftId,
        })
        .returning({ id: schema.transactions.id });

      // Lock and credit astrologer wallet
      let astroWallet = (
        await tx.execute<{ id: string; balance: string }>(
          sql`SELECT id, balance FROM wallets WHERE astrologer_id = ${receiverId} LIMIT 1 FOR UPDATE`,
        )
      ).rows?.[0];
      if (!astroWallet) {
        const [created] = await tx
          .insert(schema.wallets)
          .values({
            astrologerId: receiverId,
          })
          .returning({
            id: schema.wallets.id,
            balance: schema.wallets.balance,
          });
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
        astrologerId: receiverId,
        type: 'credit',
        category: 'gift',
        amount: amountStr,
        fee: '0',
        netAmount: amountStr,
        status: 'success',
        description: `Gift received: ${gift.name}`,
        referenceId: giftId,
      });

      await tx.insert(schema.giftTransactions).values({
        giftId,
        senderId,
        receiverId,
        transactionId: debitTxn?.id,
      });

      await tx
        .update(schema.astrologers)
        .set({
          totalEarnings: sql`${schema.astrologers.totalEarnings} + ${amountStr}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(schema.astrologers.userId, receiverId));
    });

    // Emit wallet updates outside transaction
    const updatedSenderBalance = Number(
      (
        await this.db
          .select({ balance: schema.wallets.balance })
          .from(schema.wallets)
          .where(eq(schema.wallets.userId, data.senderId))
          .limit(1)
      )[0]?.balance || 0,
    ).toFixed(2);
    const updatedAstroBalance = Number(
      (
        await this.db
          .select({ balance: schema.wallets.balance })
          .from(schema.wallets)
          .where(eq(schema.wallets.astrologerId, data.receiverId))
          .limit(1)
      )[0]?.balance || 0,
    ).toFixed(2);

    this.realtime.emitToUser(data.senderId, 'wallet:updated', {
      balance: updatedSenderBalance,
    });
    this.realtime.emitToUser(data.receiverId, 'wallet:updated', {
      balance: updatedAstroBalance,
    });
    this.realtime.emitToUser(data.receiverId, 'gift:sent', {
      giftId: data.giftId,
      senderId: data.senderId,
      receiverId: data.receiverId,
    });

    this.notifications
      .create({
        astrologerId: data.receiverId,
        type: 'transactional',
        title: 'Gift received 🎁',
        body: `You received "${gift.name}" worth ₹${amountStr}. Redeem it in Gifts.`,
        data: { type: 'gift_received', giftId: data.giftId },
      })
      .catch((e) =>
        this.logger.warn(`Gift notification failed: ${e.message}`),
      );

    this.logger.log(
      `Gift ${data.giftId} sent from ${data.senderId} to ${data.receiverId} (${amountStr})`,
    );
    return {
      success: true,
      message: `Gift sent successfully`,
      amount: amountStr,
    };
  }

  async redeemGift(id: string, userId: string, role: string) {
    if (!UUID_RE.test(id))
      throw new BadRequestException('Invalid gift transaction');
    const txn = await this.db.query.giftTransactions.findFirst({
      where: eq(schema.giftTransactions.id, id),
    });
    if (!txn) throw new NotFoundException('Gift transaction not found');
    if (role !== 'admin' && txn.receiverId !== userId) {
      throw new ForbiddenException('You can only redeem gifts sent to you');
    }
    if (txn.isRedeemed) return { success: true, message: 'Already redeemed' };

    const [r] = await this.db
      .update(schema.giftTransactions)
      .set({ isRedeemed: true, redeemedAt: new Date() })
      .where(eq(schema.giftTransactions.id, id))
      .returning();

    this.realtime.emitToUser(txn.senderId, 'gift:redeemed', {
      giftTransactionId: r.id,
      receiverId: txn.receiverId,
    });
    this.notifications
      .create({
        userId: txn.senderId,
        type: 'transactional',
        title: 'Gift redeemed',
        body: 'Your gift has been redeemed by the astrologer.',
        data: { type: 'gift_redeemed', giftTransactionId: r.id },
      })
      .catch((e) =>
        this.logger.warn(`Gift redeem notification failed: ${e.message}`),
      );

    return r;
  }
}
