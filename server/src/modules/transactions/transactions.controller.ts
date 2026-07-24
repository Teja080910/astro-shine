import { Controller, Get, Post, Param, Body, Query, Put, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get('my')
  @UseGuards(AuthGuard)
  async findMyTransactions(@CurrentUser() userId: string) {
    return this.service.findByUserIdOrAstrologerId(userId);
  }

  @Get()
  async findAll(@Query('walletId') walletId?: string, @Req() req?: any) {
    if (req?.userRole !== 'admin') throw new ForbiddenException('Only admins can view all transactions');
    if (walletId) return this.service.findByWalletId(walletId);
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req?: any) {
    if (req?.userRole !== 'admin') throw new ForbiddenException('Only admins can view transactions');
    return this.service.findById(id);
  }

  @Post()
  async create(@Body() body: any, @Req() req?: any) {
    if (req?.userRole !== 'admin') throw new ForbiddenException('Only admins can create transactions');
    return this.service.create(body);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: 'pending' | 'success' | 'failed' | 'refunded' }, @Req() req?: any) {
    if (req?.userRole !== 'admin') throw new ForbiddenException('Only admins can update transaction status');
    return this.service.updateStatus(id, body.status);
  }
}
