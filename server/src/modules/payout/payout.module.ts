import { Module } from '@nestjs/common';
import { PayoutService } from './payout.service';
import { PayoutController } from './payout.controller';

@Module({
  controllers: [PayoutController],
  providers: [PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}
