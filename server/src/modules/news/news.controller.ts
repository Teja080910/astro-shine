import { Controller, Get, Post, Put, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { NewsService } from './news.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('news')
export class NewsController {
  constructor(private readonly service: NewsService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get('admin')
  async findAllAdmin() { return this.service.findAllAdmin(); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can create news');
    return this.service.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can update news');
    return this.service.update(id, body);
  }
}
