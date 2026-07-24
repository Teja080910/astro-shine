import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
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
  @UseGuards(AuthGuard)
  async findAll(@Req() req: any, @Query('userId') userId?: string) {
    if (userId) return this.service.findByUserId(userId);
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can view all orders');
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Get(':id/items')
  async getItems(@Param('id') id: string) { return this.service.getItems(id); }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    return this.service.create({ ...body, userId: req.userId });
  }

  @Post(':id/items')
  @UseGuards(AuthGuard)
  async addItem(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const order = await this.service.findById(id);
    if (!order) throw new ForbiddenException('Order not found');
    if (order.userId !== req.userId && req.userRole !== 'admin') throw new ForbiddenException('Unauthorized');
    return this.service.addItem({ ...body, orderId: id });
  }

  @Put(':id/status')
  @UseGuards(AuthGuard)
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can update order status');
    return this.service.updateStatus(id, body.status);
  }
}
