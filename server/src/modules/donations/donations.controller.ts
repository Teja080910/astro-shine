import { Controller, Get, Post, Body } from '@nestjs/common';
import { DonationsService } from './donations.service';

@Controller('donations')
export class DonationsController {
  constructor(private readonly service: DonationsService) {}

  @Get('stats')
  async getStats() { return this.service.getStats(); }

  @Get('logs')
  async getLogs() { return this.service.getLogs(); }

  @Post('received')
  async addReceived(@Body() body: { amount: number; userId?: string; note?: string }) {
    return this.service.createReceived(body);
  }

  @Post('withdrawn')
  async addWithdrawn(@Body() body: { adminId: string; amount: number; note?: string }) {
    return this.service.createWithdrawn(body);
  }
}
