import { Controller, Get, Post, Param, Body, Query, Put, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get('my')
  @UseGuards(AuthGuard)
  async findMyTransactions(@CurrentUser() userId: string) {
    return this.service.findByUserIdOrAstrologerId(userId);
  }

  @Get()
  async findAll(@Query('walletId') walletId?: string) {
    if (walletId) return this.service.findByWalletId(walletId);
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: 'pending' | 'success' | 'failed' | 'refunded' }) {
    return this.service.updateStatus(id, body.status);
  }
}
