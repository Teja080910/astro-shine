import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { WalletModule } from '../wallet/wallet.module';
import { CommissionModule } from '../commission/commission.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [WalletModule, CommissionModule, AuthModule],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
