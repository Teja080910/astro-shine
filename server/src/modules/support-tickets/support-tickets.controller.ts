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
  @UseGuards(AuthGuard)
  async assign(@Param('id') id: string, @Req() req: any) {
    return this.service.assign(id, req.userId);
  }

  @Put('tickets/:id/resolve')
  @UseGuards(AuthGuard)
  async resolve(@Param('id') id: string) { return this.service.resolve(id); }

  @Get('tickets/:id/replies')
  @UseGuards(AuthGuard)
  async getReplies(@Param('id') id: string) { return this.service.getReplies(id); }

  @Post('tickets/:id/replies')
  @UseGuards(AuthGuard)
  async addReply(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.service.addReply({ ...body, ticketId: id, userId: req.userId });
  }
}
