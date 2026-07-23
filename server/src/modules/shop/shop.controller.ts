import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ShopService } from './shop.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('shop')
export class ShopController {
  constructor(private readonly service: ShopService) {}

  @Get()
  async findAll(@Query('category') category?: string) {
    if (category) return this.service.findByCategory(category);
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can create products');
    return this.service.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can update products');
    return this.service.update(id, body);
  }
}
