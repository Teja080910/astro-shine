import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { AppReleasesService } from './app-releases.service';

@Controller('releases')
export class AppReleasesController {
  constructor(private readonly service: AppReleasesService) {}

  @Get()
  async findAll(@Query('appName') appName?: string, @Query('platform') platform?: string) {
    if (appName) return this.service.findByApp(appName, platform);
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
}
