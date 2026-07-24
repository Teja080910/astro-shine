import { Controller, Get, Post, Param, Body, Query, Put, UseGuards } from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('gifts')
@UseGuards(AuthGuard)
export class GiftsController {
  constructor(private readonly service: GiftsService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get('transactions')
  async getTransactions(@Query('userId') userId?: string) { return this.service.getGiftTransactions(userId); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Post('send')
  async sendGift(@Body() body: any) { return this.service.sendGift(body); }

  @Put('transactions/:id/redeem')
  async redeem(@Param('id') id: string) { return this.service.redeemGift(id); }
}
