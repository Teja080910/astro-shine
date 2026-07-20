import { Controller, Get, Post, Param, Body, Put } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';

@Controller('withdrawals')
export class WithdrawalController {
  constructor(private readonly service: WithdrawalService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Post('admin')
  async adminWithdrawal(@Body() body: { adminId: string; amount: number }) {
    return this.service.createAdminWithdrawal(body.adminId, body.amount);
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string, @Body() body: { adminId: string }) { return this.service.approve(id, body.adminId); }

  @Put(':id/reject')
  async reject(@Param('id') id: string, @Body() body: { adminId: string; note?: string }) { return this.service.reject(id, body.adminId, body.note); }
}
