import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { MandirPoojaService } from './mandir-pooja.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { parsePagination } from '../../common/utils/pagination';

@Controller('mandir-pooja')
export class MandirPoojaController {
  constructor(private readonly service: MandirPoojaService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.service.findAll(parsePagination(query));
  }

  @Get('admin')
  async findAllAdmin(@Query() query: any) {
    return this.service.findAllAdmin(parsePagination(query));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can create poojas');
    return this.service.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can update poojas');
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can delete poojas');
    return this.service.delete(id);
  }

  @Get('bookings/list')
  @UseGuards(AuthGuard)
  async getBookings(@Req() req: any, @Query() query: any) {
    const targetUserId = query.userId || req.userId;
    return this.service.getBookings(
      targetUserId,
      query.poojaId,
      parsePagination(query),
    );
  }

  @Post('bookings')
  @UseGuards(AuthGuard)
  async createBooking(@Body() body: any, @Req() req: any) {
    return this.service.createBooking({ ...body, userId: req.userId });
  }

  @Put('bookings/:id/status')
  @UseGuards(AuthGuard)
  async updateBookingStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateBookingStatus(id, body.status);
  }
}
