import { Controller, Get, Post, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('donations')
@UseGuards(AuthGuard)
export class DonationsController {
  constructor(private readonly service: DonationsService) {}

  @Get('stats')
  async getStats(@Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can view donation stats');
    return this.service.getStats();
  }

  @Get('logs')
  async getLogs(@Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can view donation logs');
    return this.service.getLogs();
  }

  @Post('received')
  async addReceived(@Body() body: { amount: number; userId?: string; note?: string }, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can add donation records');
    return this.service.createReceived(body);
  }

  @Post('withdrawn')
  async addWithdrawn(@Body() body: { amount: number; note?: string }, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can withdraw donations');
    return this.service.createWithdrawn({ ...body, adminId: req.userId });
  }
}
