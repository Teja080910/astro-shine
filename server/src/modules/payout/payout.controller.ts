import { Controller, Get, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { PayoutService } from './payout.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('payouts')
@UseGuards(AuthGuard)
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Get(':id/status')
  async getStatus(@Param('id') id: string, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can view payout status');
    return this.payoutService.getPayoutStatus(id);
  }
}
