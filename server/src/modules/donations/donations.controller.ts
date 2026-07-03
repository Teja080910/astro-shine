import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { DonationsService } from './donations.service';

@Controller('donations')
export class DonationsController {
  constructor(private readonly service: DonationsService) {}

  @Get()
  async findAll(@Query('userId') userId?: string) {
    if (userId) return this.service.findByUserId(userId);
    return this.service.findAll();
  }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }
}
