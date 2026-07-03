import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { AstrologersService } from './astrologers.service';

function stripPassword(u: any) { if (!u) return u; const { password, ...r } = u; return r; }

@Controller('astrologers')
export class AstrologersController {
  constructor(private readonly service: AstrologersService) {}

  @Get()
  async findAll() { const items = await this.service.findAll(); return items.map(stripPassword); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return stripPassword(await this.service.findById(id)); }

  @Post()
  async create(@Body() body: any) { return stripPassword(await this.service.create(body)); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) { return stripPassword(await this.service.update(id, body)); }

  @Post(':id/verify')
  async verify(@Param('id') id: string, @Body() body: { status: 'approved' | 'rejected'; note?: string }) {
    return stripPassword(await this.service.verify(id, body.status, body.note));
  }

  @Put(':id/online-status')
  async onlineStatus(@Param('id') id: string, @Body() body: { status: 'online' | 'offline' | 'busy' }) {
    return stripPassword(await this.service.updateOnlineStatus(id, body.status));
  }
}
