import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AppReleasesService } from './app-releases.service';
import { AuthGuard } from '../../common/guards/auth.guard';

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
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can create releases');
    return this.service.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can update releases');
    return this.service.update(id, body);
  }
}
