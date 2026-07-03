import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly service: VideosService) {}

  @Get()
  async findAll(@Query('category') category?: string) {
    if (category) return this.service.findByCategory(category);
    return this.service.findAll();
  }

  @Get('admin')
  async findAllAdmin() { return this.service.findAllAdmin(); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
}
