import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get(':key')
  async findByKey(@Param('key') key: string) { return this.service.findByKey(key); }

  @Post(':key')
  @UseGuards(AuthGuard)
  async set(@Param('key') key: string, @Body() body: { value: any; updatedBy?: string; description?: string }, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can change settings');
    return this.service.set(key, body.value, req.userId, body.description);
  }
}
