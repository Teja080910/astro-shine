import { Controller, Get, Post, Param, Body, Query, Put } from '@nestjs/common';
import { CallsService } from './calls.service';

@Controller('calls')
export class CallsController {
  constructor(private readonly service: CallsService) {}

  @Get()
  async findAll(@Query('userId') userId?: string, @Query('astrologerId') astrologerId?: string) {
    if (userId) return this.service.findByUserId(userId);
    if (astrologerId) return this.service.findByAstrologerId(astrologerId);
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) { return this.service.updateStatus(id, body.status); }
}
