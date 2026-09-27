import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AppReleasesService } from './app-releases.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { parsePagination } from '../../common/utils/pagination';

@Controller('releases')
export class AppReleasesController {
  constructor(private readonly service: AppReleasesService) {}

  @Get()
  async findAll(@Query('appName') appName?: string, @Query('platform') platform?: string, @Query() query?: any) {
    const p = parsePagination(query);
    if (appName) return this.service.findByApp(appName, platform, p);
    return this.service.findAll(p);
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
