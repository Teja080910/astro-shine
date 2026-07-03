import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get(':key')
  async findByKey(@Param('key') key: string) { return this.service.findByKey(key); }

  @Post(':key')
  async set(@Param('key') key: string, @Body() body: { value: any; updatedBy?: string; description?: string }) {
    return this.service.set(key, body.value, body.updatedBy, body.description);
  }
}
