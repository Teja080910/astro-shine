import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import RazorpayX from 'razorpayx';

export interface BankDetails {
  accountNumber: string;
  ifsc: string;
  name?: string;
  holderName?: string;
  account_name?: string;
}

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);
  private client: ReturnType<typeof RazorpayX> | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient() {
    if (this.client) return this.client;
    const key = this.configService.get<string>('RAZORPAYX_KEY_ID');
    const secret = this.configService.get<string>('RAZORPAYX_KEY_SECRET');
    if (!key || !secret) {
      throw new BadRequestException(
        'RazorpayX is not configured. Please set RAZORPAYX_KEY_ID and RAZORPAYX_KEY_SECRET.',
      );
    }
    this.client = RazorpayX(key, secret);
    return this.client;
  }

  private normalizeBank(bank: BankDetails) {
    const name =
      bank.name || bank.holderName || bank.account_name || 'Astrologer Payout';
    return {
      name,
      ifsc: bank.ifsc,
      account_number: bank.accountNumber,
    };
  }

  async createOrGetContact(params: {
    astrologerId: string;
    name: string;
    email?: string;
    phone?: string;
  }): Promise<{ contactId: string }> {
    const client = this.getClient();
    try {
      const existing = await client.Contact.getAll({
        reference_id: params.astrologerId,
      });
      if (existing && existing.items?.length > 0) {
        return { contactId: existing.items[0].id };
      }
    } catch (e: any) {
      this.logger.warn(`Failed to fetch existing RazorpayX contact: ${e.message}`);
    }

    const contact = await client.Contact.create({
      name: params.name,
      email: params.email,
      contact: params.phone,
      type: 'customer',
      reference_id: params.astrologerId,
      notes: { astrologerId: params.astrologerId },
    });
    return { contactId: contact.id };
  }

  async createOrGetFundAccount(params: {
    contactId: string;
    bank: BankDetails;
    referenceId: string;
  }): Promise<{ fundAccountId: string }> {
    const client = this.getClient();
    try {
      const accounts = await client.FundAccount.getAll({
        contact_id: params.contactId,
      });
      const bankAccount = this.normalizeBank(params.bank);
      const existing = accounts?.items?.find(
        (a: any) =>
          a.account_type === 'bank_account' &&
          a.bank_account?.account_number === bankAccount.account_number,
      );
      if (existing) {
        return { fundAccountId: existing.id };
      }
    } catch (e: any) {
      this.logger.warn(`Failed to fetch existing RazorpayX fund account: ${e.message}`);
    }

    const bankAccount = this.normalizeBank(params.bank);
    const account = await client.FundAccount.create({
      contact_id: params.contactId,
      account_type: 'bank_account',
      bank_account: bankAccount,
    } as any);
    return { fundAccountId: account.id };
  }

  async createPayout(params: {
    astrologerId: string;
    astrologerName: string;
    email?: string;
    phone?: string;
    bank: BankDetails;
    amount: number;
    referenceId: string;
  }): Promise<{ payoutId: string; payoutStatus: string; utr?: string; response: any }> {
    const client = this.getClient();

    const { contactId } = await this.createOrGetContact({
      astrologerId: params.astrologerId,
      name: params.astrologerName,
      email: params.email,
      phone: params.phone,
    });

    const { fundAccountId } = await this.createOrGetFundAccount({
      contactId,
      bank: params.bank,
      referenceId: params.referenceId,
    });

    const payout = await client.Payout.create({
      account_number: this.configService.get<string>('RAZORPAYX_DEFAULT_ACCOUNT'),
      fund_account_id: fundAccountId,
      amount: Math.round(params.amount * 100),
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      reference_id: params.referenceId,
      narration: `Payout to ${params.astrologerName}`,
      notes: {
        astrologerId: params.astrologerId,
        withdrawalRequestId: params.referenceId,
      },
      queue_if_low_balance: true,
    });

    return {
      payoutId: payout.id,
      payoutStatus: payout.status,
      utr: payout.utr,
      response: payout,
    };
  }

  async getPayoutStatus(payoutId: string) {
    const client = this.getClient();
    return client.Payout.get(payoutId);
  }
}
