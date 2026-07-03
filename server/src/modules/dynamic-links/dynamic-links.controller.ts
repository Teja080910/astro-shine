import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { DynamicLinksService } from './dynamic-links.service';

@Controller('dynamic-links')
export class DynamicLinksController {
  constructor(private readonly service: DynamicLinksService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get('admin')
  async findAllAdmin() { return this.service.findAllAdmin(); }

  @Get('page/:pageName')
  async findByPage(@Param('pageName') pageName: string) { return this.service.findByPage(pageName); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
}
