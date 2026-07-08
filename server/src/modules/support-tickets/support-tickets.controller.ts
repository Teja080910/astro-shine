import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SupportTicketsService } from './support-tickets.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('support')
export class SupportTicketsController {
  constructor(private readonly service: SupportTicketsService) {}

  @Get('tickets')
  @UseGuards(AuthGuard)
  async findAll(@CurrentUser() currentUserId: string, @Query('userId') queryUserId?: string) {
    const targetUserId = queryUserId || currentUserId;
    return this.service.findByUserId(targetUserId);
  }

  @Get('tickets/:id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post('tickets')
  @UseGuards(AuthGuard)
  async create(@CurrentUser() userId: string, @Body() body: any) {
    return this.service.create({ ...body, userId });
  }

  @Put('tickets/:id/assign')
  async assign(@Param('id') id: string, @Body() body: { adminId: string }) { return this.service.assign(id, body.adminId); }

  @Put('tickets/:id/resolve')
  async resolve(@Param('id') id: string) { return this.service.resolve(id); }

  @Get('tickets/:id/replies')
  async getReplies(@Param('id') id: string) { return this.service.getReplies(id); }

  @Post('tickets/:id/replies')
  async addReply(@Param('id') id: string, @Body() body: any) { return this.service.addReply({ ...body, ticketId: id }); }
}
