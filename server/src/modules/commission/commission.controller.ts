import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { CommissionService } from './commission.service';

@Controller('commissions')
export class CommissionController {
  constructor(private readonly service: CommissionService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get('logs')
  async getLogs(@Query('astrologerId') astrologerId?: string) { return this.service.getLogs(astrologerId); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
}
