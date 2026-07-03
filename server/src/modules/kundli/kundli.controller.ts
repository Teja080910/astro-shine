import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { KundliService } from './kundli.service';

@Controller('kundli')
export class KundliController {
  constructor(private readonly service: KundliService) {}

  @Get()
  async findByUser(@Query('userId') userId: string) {
    return userId ? this.service.findByUserId(userId) : [];
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
}
