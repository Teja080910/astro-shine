import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { AdminsService } from './admins.service';

function stripPassword(u: any) { if (!u) return u; const { password, ...r } = u; return r; }

@Controller('admins')
export class AdminsController {
  constructor(private readonly service: AdminsService) {}

  @Get()
  async findAll() { const items = await this.service.findAll(); return items.map(stripPassword); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return stripPassword(await this.service.findById(id)); }

  @Post()
  async create(@Body() body: any) { return stripPassword(await this.service.create(body)); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) { return stripPassword(await this.service.update(id, body)); }
}
