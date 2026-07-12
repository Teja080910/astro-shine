import { Injectable, Inject, BadRequestException, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, sql, inArray } from 'drizzle-orm';
import Razorpay from 'razorpay';
import { WalletService } from '../wallet/wallet.service';
import { TransactionsService } from '../transactions/transactions.service';
import { DonationsService } from '../donations/donations.service';
import { OrdersService } from '../orders/orders.service';
import crypto from 'crypto';

const FINAL_STATES = ['paid', 'failed', 'refunded', 'processing'] as const;
type PaymentStatus = (typeof FINAL_STATES)[number];

interface PaymentMetadata {
  userId: string;
  recipientId?: string;
  paymentType: string;
  entityType?: string;
  entityId?: string;
  bookingId?: string;
  sessionId?: string;
  orderId?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: Razorpay;

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private configService: ConfigService,
    private walletService: WalletService,
    private transactionsService: TransactionsService,
    private donationsService: DonationsService,
    private ordersService: OrdersService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID')!,
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET')!,
    });
  }

  async createOrder(userId: string, amount: number, purpose: string, metadata: Partial<PaymentMetadata> = {}) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const validPurposes = ['wallet_recharge', 'donation', 'order_payment', 'pooja_booking'];
    if (!validPurposes.includes(purpose)) {
      throw new BadRequestException(`Invalid purpose. Must be one of: ${validPurposes.join(', ')}`);
    }

    const razorpayOrder = await this.razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${userId.slice(0, 8)}`,
      notes: {
        userId,
        purpose,
        ...metadata,
      },
    });

    const fullMetadata: PaymentMetadata = {
      userId,
      paymentType: purpose,
      ...metadata,
    };

    const [paymentOrder] = await this.db
      .insert(schema.paymentOrders)
      .values({
        userId,
        razorpayOrderId: razorpayOrder.id,
        amount: amount.toString(),
        currency: 'INR',
        purpose,
        status: 'created',
        metadata: fullMetadata as any,
      })
      .returning();

    return {
      id: paymentOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: this.configService.get<string>('RAZORPAY_KEY_ID'),
      purpose: paymentOrder.purpose,
      status: paymentOrder.status,
    };
  }

  async verifyPayment(
    userId: string,
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string,
  ) {
    const paymentOrder = await this.db.query.paymentOrders.findFirst({
      where: eq(schema.paymentOrders.razorpayOrderId, razorpayOrderId),
    });

    if (!paymentOrder) {
      throw new NotFoundException('Payment order not found');
    }

    if (paymentOrder.userId !== userId) {
      throw new UnauthorizedException('Payment order does not belong to this user');
    }

    if (FINAL_STATES.includes(paymentOrder.status as any)) {
      throw new BadRequestException('Payment order is already in a final state');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.configService.get<string>('RAZORPAY_KEY_SECRET')!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const razorpayPayment = await this.razorpay.payments.fetch(razorpayPaymentId);

    if (razorpayPayment.status !== 'captured') {
      await this.db
        .update(schema.paymentOrders)
        .set({
          status: 'failed',
          failedReason: `Razorpay payment status: ${razorpayPayment.status}`,
          razorpayPaymentId,
          razorpaySignature,
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentOrders.id, paymentOrder.id));

      return { success: false, status: 'failed' };
    }

    return this.processSuccessfulPayment(paymentOrder, razorpayPaymentId, razorpaySignature);
  }

  private async resolveUserWallet(userId: string) {
    let wallet = await this.walletService.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await this.walletService.createWallet({ userId });
    }
    return wallet;
  }

  private async processSuccessfulPayment(
    paymentOrder: typeof schema.paymentOrders.$inferSelect,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const amount = Number(paymentOrder.amount);
    const metadata = paymentOrder.metadata as unknown as PaymentMetadata;
    const wallet = await this.resolveUserWallet(paymentOrder.userId);

    let category: string;
    switch (paymentOrder.purpose) {
      case 'wallet_recharge': category = 'add_funds'; break;
      case 'donation': category = 'donation'; break;
      case 'order_payment': category = 'order_payment'; break;
      default: category = 'refund';
    }

    const [transaction] = await this.db
      .insert(schema.transactions)
      .values({
        walletId: wallet.id,
        userId: paymentOrder.userId,
        type: 'credit',
        category: category as any,
        amount: amount.toString(),
        fee: '0',
        netAmount: amount.toString(),
        status: 'pending',
        referenceId: razorpayPaymentId,
        gatewayResponse: { razorpayPaymentId, razorpaySignature },
        description: `${paymentOrder.purpose} payment`,
        metadata: metadata as any,
      })
      .returning();

    let result: any = { transaction };

    switch (paymentOrder.purpose) {
      case 'wallet_recharge': {
        const updatedWallet = await this.walletService.addFunds(wallet.id, amount.toString());
        result.wallet = updatedWallet;
        break;
      }

      case 'donation': {
        await this.donationsService.create({
          userId: paymentOrder.userId,
          amount: amount.toString(),
          transactionId: transaction.id,
          message: 'Donation via Razorpay',
        });
        break;
      }

      case 'order_payment': {
        if (metadata.orderId) {
          await this.ordersService.updateStatus(metadata.orderId, 'confirmed');
        }
        break;
      }

      case 'pooja_booking': {
        if (metadata.bookingId) {
          await this.db
            .update(schema.poojaBookings)
            .set({ status: 'confirmed', transactionId: transaction.id, updatedAt: new Date() })
            .where(eq(schema.poojaBookings.id, metadata.bookingId));
        }
        break;
      }
    }

    await this.db
      .update(schema.transactions)
      .set({ status: 'success' })
      .where(eq(schema.transactions.id, transaction.id));

    await this.db
      .update(schema.paymentOrders)
      .set({
        status: 'paid',
        razorpayPaymentId,
        razorpaySignature,
        transactionId: transaction.id,
        metadata: sql`${schema.paymentOrders.metadata} || ${JSON.stringify({ razorpayPaymentId })}::jsonb`,
        updatedAt: new Date(),
      })
      .where(eq(schema.paymentOrders.id, paymentOrder.id));

    const finalTransaction = await this.transactionsService.findById(transaction.id);

    return {
      success: true,
      transaction: finalTransaction,
      ...(result.wallet ? { wallet: result.wallet } : {}),
    };
  }

  async getPaymentStatus(id: string, userId: string) {
    const paymentOrder = await this.db.query.paymentOrders.findFirst({
      where: eq(schema.paymentOrders.id, id),
      with: {
        transaction: true,
      },
    });

    if (!paymentOrder) {
      throw new NotFoundException('Payment order not found');
    }

    if (paymentOrder.userId !== userId) {
      throw new UnauthorizedException('Payment order does not belong to this user');
    }

    return {
      id: paymentOrder.id,
      razorpayOrderId: paymentOrder.razorpayOrderId,
      razorpayPaymentId: paymentOrder.razorpayPaymentId,
      amount: Number(paymentOrder.amount) * 100,
      purpose: paymentOrder.purpose,
      status: paymentOrder.status,
      transaction: paymentOrder.transaction,
    };
  }

  async handleWebhook(body: any, signature: string) {
    const isValid = Razorpay.validateWebhookSignature(
      JSON.stringify(body),
      signature,
      this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET')!,
    );

    if (!isValid) {
      this.logger.warn('Invalid webhook signature received');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = body;
    const eventId = event.id;
    const eventType = event.event;

    const existingEvent = await this.db.query.paymentEvents.findFirst({
      where: eq(schema.paymentEvents.eventId, eventId),
    });

    if (existingEvent && existingEvent.status === 'processed') {
      return { received: true, ignored: true };
    }

    if (existingEvent && existingEvent.status === 'received') {
      return { received: true, ignored: true };
    }

    const razorpayOrderId = event.payload?.payment?.entity?.order_id;
    const razorpayPaymentId = event.payload?.payment?.entity?.id;

    if (!razorpayOrderId) {
      await this.db.insert(schema.paymentEvents).values({
        eventId,
        eventType,
        payload: event as any,
        status: 'ignored',
        errorMessage: 'No order_id in webhook payload',
        processedAt: new Date(),
      });
      return { received: true, ignored: true };
    }

    const paymentOrder = await this.db.query.paymentOrders.findFirst({
      where: eq(schema.paymentOrders.razorpayOrderId, razorpayOrderId),
    });

    if (!paymentOrder) {
      await this.db.insert(schema.paymentEvents).values({
        eventId,
        eventType,
        payload: event as any,
        status: 'ignored',
        errorMessage: `No payment order found for razorpay_order_id: ${razorpayOrderId}`,
        processedAt: new Date(),
      });
      return { received: true, ignored: true };
    }

    const [paymentEvent] = await this.db
      .insert(schema.paymentEvents)
      .values({
        paymentOrderId: paymentOrder.id,
        eventId,
        eventType,
        razorpayEventId: razorpayPaymentId,
        payload: event as any,
        status: 'received',
      })
      .returning();

    try {
      switch (eventType) {
        case 'payment.captured': {
          if (!FINAL_STATES.includes(paymentOrder.status as any)) {
            await this.processSuccessfulPayment(paymentOrder, razorpayPaymentId!, '');
          }
          break;
        }

        case 'payment.failed': {
          if (!FINAL_STATES.includes(paymentOrder.status as any)) {
            const failedReason = event.payload?.payment?.entity?.error_description || 'Payment failed via webhook';
            await this.db
              .update(schema.paymentOrders)
              .set({
                status: 'failed',
                failedReason,
                razorpayPaymentId: razorpayPaymentId || undefined,
                updatedAt: new Date(),
              })
              .where(eq(schema.paymentOrders.id, paymentOrder.id));
          }
          break;
        }

        case 'refund.created':
        case 'refund.processed': {
          if (paymentOrder.transactionId) {
            await this.transactionsService.updateStatus(paymentOrder.transactionId, 'refunded');
          }
          await this.db
            .update(schema.paymentOrders)
            .set({ status: 'refunded', updatedAt: new Date() })
            .where(eq(schema.paymentOrders.id, paymentOrder.id));
          break;
        }
      }

      await this.db
        .update(schema.paymentEvents)
        .set({ status: 'processed', processedAt: new Date() })
        .where(eq(schema.paymentEvents.id, paymentEvent.id));
    } catch (error: any) {
      this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
      await this.db
        .update(schema.paymentEvents)
        .set({
          status: 'failed',
          errorMessage: error.message,
          processedAt: new Date(),
        })
        .where(eq(schema.paymentEvents.id, paymentEvent.id));
      throw error;
    }

    return { received: true };
  }

  async refundPayment(paymentOrderId: string, amount?: number, reason?: string) {
    const paymentOrder = await this.db.query.paymentOrders.findFirst({
      where: eq(schema.paymentOrders.id, paymentOrderId),
    });

    if (!paymentOrder) {
      throw new NotFoundException('Payment order not found');
    }

    if (paymentOrder.status !== 'paid') {
      throw new BadRequestException('Only paid payments can be refunded');
    }

    if (!paymentOrder.razorpayPaymentId) {
      throw new BadRequestException('No Razorpay payment ID found for this order');
    }

    const refundOptions: any = {};
    if (amount) {
      refundOptions.amount = Math.round(amount * 100);
    }
    if (reason) {
      refundOptions.notes = { reason };
    }

    const refund = await this.razorpay.payments.refund(paymentOrder.razorpayPaymentId, refundOptions);

    if (paymentOrder.transactionId) {
      await this.transactionsService.updateStatus(paymentOrder.transactionId, 'refunded');
    }

    await this.db
      .update(schema.paymentOrders)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(schema.paymentOrders.id, paymentOrder.id));

    await this.db.insert(schema.paymentEvents).values({
      paymentOrderId: paymentOrder.id,
      eventId: `refund_${refund.id}`,
      eventType: 'refund.created',
      razorpayEventId: refund.id,
      payload: refund as any,
      status: 'processed',
      processedAt: new Date(),
    });

    return {
      refundId: refund.id,
      status: 'processed',
      amount: refund.amount,
    };
  }

  async getNonFinalPaymentOrders() {
    return this.db.query.paymentOrders.findMany({
      where: and(
        sql`${schema.paymentOrders.status} NOT IN (${sql.join(FINAL_STATES.map(s => sql`${s}`), sql`, `)})`,
      ),
      orderBy: (orders, { asc }) => [asc(orders.createdAt)],
    });
  }

  async reconcilePaymentOrder(paymentOrder: typeof schema.paymentOrders.$inferSelect) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (paymentOrder.createdAt < thirtyDaysAgo) {
      await this.db
        .update(schema.paymentOrders)
        .set({
          status: 'failed',
          failedReason: 'AUTO_FAILED_AFTER_TIMEOUT',
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentOrders.id, paymentOrder.id));

      await this.db.insert(schema.paymentEvents).values({
        paymentOrderId: paymentOrder.id,
        eventId: `timeout_${paymentOrder.id}`,
        eventType: 'payment.timeout',
        payload: { reason: 'AUTO_FAILED_AFTER_TIMEOUT', createdAt: paymentOrder.createdAt } as any,
        status: 'processed',
        processedAt: new Date(),
      });

      return;
    }

    if (!paymentOrder.razorpayOrderId) {
      this.logger.warn(`Payment order ${paymentOrder.id} has no razorpayOrderId, skipping`);
      return;
    }

    try {
      const razorpayOrder = await this.razorpay.orders.fetch(paymentOrder.razorpayOrderId);

      const statusMap: Record<string, string> = {
        created: 'created',
        attempted: 'attempted',
        paid: 'paid',
      };

      const mappedStatus = statusMap[razorpayOrder.status] || paymentOrder.status;

      if (mappedStatus === 'paid' && razorpayOrder.id) {
        const payments = await this.razorpay.payments.all({
          from: 0,
          to: Math.floor(Date.now() / 1000),
          count: 50,
        });
        const matchingPayments = payments.items.filter((p: any) => p.order_id === razorpayOrder.id && p.status === 'captured');
        if (matchingPayments.length > 0) {
          await this.processSuccessfulPayment(paymentOrder, matchingPayments[0].id, '');
          return;
        }
      }

      if (mappedStatus !== paymentOrder.status && mappedStatus === 'paid') {
        await this.db
          .update(schema.paymentOrders)
          .set({ status: mappedStatus, updatedAt: new Date() })
          .where(eq(schema.paymentOrders.id, paymentOrder.id));
      }
    } catch (error: any) {
      this.logger.error(
        `Rescue reconciliation failed for order ${paymentOrder.id}: ${error.message}`,
      );
    }
  }

  async isInFinalState(status: string): Promise<boolean> {
    return FINAL_STATES.includes(status as any);
  }
}
