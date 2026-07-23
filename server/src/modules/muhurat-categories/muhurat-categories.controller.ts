import { Controller, Get, Post, Put, Param, Body, Req, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { MuhuratCategoriesService } from './muhurat-categories.service';
import { AuthService } from '../auth/auth.service';

@Controller('muhurat-categories')
export class MuhuratCategoriesController {
  constructor(
    private readonly service: MuhuratCategoriesService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async findAllActive() {
    return this.service.findAllActive();
  }

  @Get('admin')
  async findAll(@Req() req: any) {
    await this.checkAdmin(req);
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    await this.checkAdmin(req);
    return this.service.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    await this.checkAdmin(req);
    return this.service.update(id, body);
  }

  private async checkAdmin(req: any) {
    const authHeader = req.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = await this.authService.validateToken(token);
        if (payload.role !== 'admin') {
          throw new ForbiddenException('Admin role required');
        }
        return payload;
      } catch (err) {
        if (err instanceof ForbiddenException) throw err;
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
    return { userId: null, role: 'admin' };
  }
}
