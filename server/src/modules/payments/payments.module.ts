import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsRescueService } from './payments-rescue.service';
import { WalletModule } from '../wallet/wallet.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { DonationsModule } from '../donations/donations.module';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    WalletModule,
    TransactionsModule,
    DonationsModule,
    OrdersModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRescueService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
