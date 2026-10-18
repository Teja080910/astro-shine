import { Module } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalController } from './withdrawal.controller';
import { RazorpayxWebhookController } from './razorpayx-webhook.controller';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { PayoutModule } from '../payout/payout.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({ imports: [WalletModule, AuthModule, PayoutModule, NotificationsModule], controllers: [WithdrawalController, RazorpayxWebhookController], providers: [WithdrawalService], exports: [WithdrawalService] })
export class WithdrawalModule {}
