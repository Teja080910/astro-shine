import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { KundliService } from './kundli.service';
import { AuthGuard } from '../../common/guards/auth.guard';

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
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    return this.service.create({ ...body, userId: req.userId });
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const existing = await this.service.findById(id);
    if (!existing) throw new Error('Record not found');
    if (existing.userId !== req.userId && req.userRole !== 'admin') throw new Error('Unauthorized');
    return this.service.update(id, body);
  }
}
