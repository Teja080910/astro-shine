import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
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

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.service.delete(id);
  }
}
