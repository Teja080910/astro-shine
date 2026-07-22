import { Controller, Get, Post, Param, Body, Query, Put, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get()
  async findByCall(@Query('callId') callId: string) {
    if (callId) return this.service.findByCallId(callId);
    return [];
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) { return this.service.markAsRead(id); }
}
