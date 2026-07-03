import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { MandirPoojaService } from './mandir-pooja.service';

@Controller('mandir-pooja')
export class MandirPoojaController {
  constructor(private readonly service: MandirPoojaService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get('admin')
  async findAllAdmin() { return this.service.findAllAdmin(); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }

  @Get('bookings/list')
  async getBookings(@Query('userId') userId?: string, @Query('poojaId') poojaId?: string) {
    return this.service.getBookings(userId, poojaId);
  }

  @Post('bookings')
  async createBooking(@Body() body: any) { return this.service.createBooking(body); }

  @Put('bookings/:id/status')
  async updateBookingStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateBookingStatus(id, body.status);
  }
}
