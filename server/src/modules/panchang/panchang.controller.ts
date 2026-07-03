import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PanchangService } from './panchang.service';

@Controller('panchang')
export class PanchangController {
  constructor(private readonly service: PanchangService) {}

  @Get()
  async findAll(@Query('date') date?: string) {
    if (date) return this.service.findByDate(date);
    return this.service.findAll();
  }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }
}
