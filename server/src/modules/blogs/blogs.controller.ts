import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly service: BlogsService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) { return this.service.findBySlug(slug); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can create blogs');
    return this.service.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can update blogs');
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can delete blogs');
    await this.service.delete(id);
  }
}
