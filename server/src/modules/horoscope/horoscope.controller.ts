import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { HoroscopeService } from './horoscope.service';

@Controller('horoscope')
export class HoroscopeController {
  constructor(private readonly service: HoroscopeService) {}

  @Get()
  async findAll(@Query('sign') sign?: string, @Query('date') date?: string) {
    if (sign && date) return this.service.findBySignAndDate(sign, date);
    if (sign) return this.service.findBySign(sign);
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
