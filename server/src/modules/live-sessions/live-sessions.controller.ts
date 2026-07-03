import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { LiveSessionsService } from './live-sessions.service';

@Controller('live-sessions')
export class LiveSessionsController {
  constructor(private readonly service: LiveSessionsService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get('live')
  async findLive() { return this.service.findLive(); }

  @Get('astrologer/:astrologerId')
  async findByAstrologerId(@Param('astrologerId') astrologerId: string) { return this.service.findByAstrologerId(astrologerId); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) { return this.service.updateStatus(id, body.status); }
}
