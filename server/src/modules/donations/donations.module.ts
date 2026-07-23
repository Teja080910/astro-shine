import { Module } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [WalletModule, AuthModule], controllers: [DonationsController], providers: [DonationsService], exports: [DonationsService] })
export class DonationsModule {}
