import { Module } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({ imports: [WalletModule], controllers: [CommissionController], providers: [CommissionService], exports: [CommissionService] })
export class CommissionModule {}
