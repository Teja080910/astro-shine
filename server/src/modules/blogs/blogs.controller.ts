import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus, UseGuards, Req, ForbiddenException, Query } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly service: BlogsService) {}

  @Get()
  async findAll(@Query('published') published?: string) {
    if (published === 'true') return this.service.findPublished();
    return this.service.findAll();
  }

  @Get('my')
  @UseGuards(AuthGuard)
  async findMy(@Req() req: any) {
    return this.service.findByAuthorId(req.userId);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) { return this.service.findBySlug(slug); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin' && req.userRole !== 'astrologer') throw new ForbiddenException('Only admins and astrologers can create blogs');
    return this.service.create({ ...body, authorId: req.userId, authorRole: req.userRole });
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const blog = await this.service.findById(id);
    if (!blog) throw new ForbiddenException('Blog not found');
    if (req.userRole !== 'admin' && blog.authorId !== req.userId) throw new ForbiddenException('Not authorized');
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string, @Req() req: any) {
    const blog = await this.service.findById(id);
    if (!blog) throw new ForbiddenException('Blog not found');
    if (req.userRole !== 'admin' && blog.authorId !== req.userId) throw new ForbiddenException('Not authorized');
    await this.service.delete(id);
  }
}
