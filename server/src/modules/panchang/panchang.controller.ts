import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PanchangService } from './panchang.service';

@Controller('panchang')
export class PanchangController {
  constructor(private readonly service: PanchangService) {}

  @Get()
  async findAll(@Query('date') date?: string) {
    if (date) return this.service.findByDate(date);
    return this.service.findAll();
  }

  @Get('festivals')
  festivals(
    @Query('startDate') startDate?: string,
    @Query('days') days?: string,
    @Query('fastingOnly') fastingOnly?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.service.festivals(
      startDate || '',
      Number(days) || 30,
      fastingOnly === 'true',
      Number(lat) || 28.6139,
      Number(lng) || 77.209,
      Number(timezone) || 5.5,
    );
  }

  @Post()
  async create(@Body() body: any) {
    return this.service.create(body);
  }

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
