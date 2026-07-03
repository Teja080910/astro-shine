import { Controller, Get, Post, Put, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async findAll(@Query('userId') userId?: string, @Query('astrologerId') astrologerId?: string) {
    if (userId) return this.service.findByUserId(userId);
    if (astrologerId) return this.service.findByAstrologerId(astrologerId);
    return [];
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) { return this.service.markAsRead(id); }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@Body() body: { userId?: string; astrologerId?: string }) {
    await this.service.markAllAsRead(body.userId, body.astrologerId);
  }
}
