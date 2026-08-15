import { Module } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalController } from './withdrawal.controller';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { PayoutModule } from '../payout/payout.module';

@Module({ imports: [WalletModule, AuthModule, PayoutModule], controllers: [WithdrawalController], providers: [WithdrawalService], exports: [WithdrawalService] })
export class WithdrawalModule {}
