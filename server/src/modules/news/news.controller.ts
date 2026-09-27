import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { NewsService } from './news.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { parsePagination } from '../../common/utils/pagination';

@Controller('news')
export class NewsController {
  constructor(private readonly service: NewsService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get('admin')
  async findAllAdmin(@Query() query: any) { return this.service.findAllAdmin(parsePagination(query)); }

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

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can delete news');
    await this.service.delete(id);
  }
}
