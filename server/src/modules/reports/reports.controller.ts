import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id/resolve')
  async resolve(@Param('id') id: string, @Body() body: { adminId: string }) { return this.service.resolve(id, body.adminId); }
}
