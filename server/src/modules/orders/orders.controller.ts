import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get('my')
  @UseGuards(AuthGuard)
  async findMyOrders(@CurrentUser() userId: string) {
    return this.service.findByUserId(userId);
  }

  @Get()
  async findAll(@Query('userId') userId?: string) {
    if (userId) return this.service.findByUserId(userId);
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Get(':id/items')
  async getItems(@Param('id') id: string) { return this.service.getItems(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Post(':id/items')
  async addItem(@Param('id') id: string, @Body() body: any) {
    return this.service.addItem({ ...body, orderId: id });
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) { return this.service.updateStatus(id, body.status); }
}
