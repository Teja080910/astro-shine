import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
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
  async sendGift(@Body() body: { giftId: string; senderId: string; receiverId: string }) {
    return this.service.sendGift(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }

  @Delete(':id')
  async delete(@Param('id') id: string) { return this.service.delete(id); }

  @Put('transactions/:id/redeem')
  async redeem(@Param('id') id: string) { return this.service.redeemGift(id); }
}
