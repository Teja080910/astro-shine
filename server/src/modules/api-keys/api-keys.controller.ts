import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) {}

  @Get()
  async findAll(@Query('provider') provider?: string) {
    if (provider) return this.service.findByProvider(provider);
    return this.service.findAll();
  }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
}
