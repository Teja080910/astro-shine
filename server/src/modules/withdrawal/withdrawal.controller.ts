import { Controller, Get, Post, Param, Body, Put, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('withdrawals')
@UseGuards(AuthGuard)
export class WithdrawalController {
  constructor(private readonly service: WithdrawalService) {}

  @Get()
  async findAll(@Req() req: any) {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    body.astrologerId = req.userId;
    return this.service.create(body);
  }

  @Post('admin')
  async adminWithdrawal(@Body() body: { amount: number }, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can make admin withdrawals');
    return this.service.createAdminWithdrawal(req.userId, body.amount);
  }

  @Post('admin')
  async adminWithdrawal(@Body() body: { adminId: string; amount: number }) {
    return this.service.createAdminWithdrawal(body.adminId, body.amount);
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can approve withdrawals');
    return this.service.approve(id, req.userId);
  }

  @Put(':id/reject')
  async reject(@Param('id') id: string, @Body() body: { note?: string }, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can reject withdrawals');
    return this.service.reject(id, req.userId, body.note);
  }
}
