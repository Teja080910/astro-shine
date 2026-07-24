import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { VideosService } from './videos.service';
import { AuthGuard } from '../../common/guards/auth.guard';

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
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can create videos');
    return this.service.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can update videos');
    return this.service.update(id, body);
  }
}
