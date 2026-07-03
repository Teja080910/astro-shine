import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { SupportTicketsService } from './support-tickets.service';

@Controller('support')
export class SupportTicketsController {
  constructor(private readonly service: SupportTicketsService) {}

  @Get('tickets')
  async findAll(@Query('userId') userId?: string) {
    if (userId) return this.service.findByUserId(userId);
    return this.service.findAll();
  }

  @Get('tickets/:id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post('tickets')
  async create(@Body() body: any) { return this.service.create(body); }

  @Put('tickets/:id/assign')
  async assign(@Param('id') id: string, @Body() body: { adminId: string }) { return this.service.assign(id, body.adminId); }

  @Put('tickets/:id/resolve')
  async resolve(@Param('id') id: string) { return this.service.resolve(id); }

  @Get('tickets/:id/replies')
  async getReplies(@Param('id') id: string) { return this.service.getReplies(id); }

  @Post('tickets/:id/replies')
  async addReply(@Param('id') id: string, @Body() body: any) { return this.service.addReply({ ...body, ticketId: id }); }
}
