import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentsService } from './payments.service';

@Injectable()
export class PaymentsRescueService {
  private readonly logger = new Logger(PaymentsRescueService.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async rescueNonFinalPayments() {
    this.logger.log('Rescue Service: scanning for non-final payment orders...');

    try {
      const nonFinalOrders = await this.paymentsService.getNonFinalPaymentOrders();

      this.logger.log(`Rescue Service: found ${nonFinalOrders.length} non-final orders`);

      let processed = 0;
      let failed = 0;

      for (const order of nonFinalOrders) {
        try {
          await this.paymentsService.reconcilePaymentOrder(order);
          processed++;
        } catch (error: any) {
          failed++;
          this.logger.error(
            `Rescue Service: failed to reconcile order ${order.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Rescue Service: completed - ${processed} processed, ${failed} failed`,
      );
    } catch (error: any) {
      this.logger.error(`Rescue Service: scan failed: ${error.message}`, error.stack);
    }
  }
}
