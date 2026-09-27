import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { MuhuratService } from './muhurat.service';
import { AuthService } from '../auth/auth.service';
import { parsePagination } from '../../common/utils/pagination';

@Controller('muhurat')
export class MuhuratController {
  constructor(
    private readonly service: MuhuratService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.service.findAll(
      query.categoryId,
      query.startDate,
      query.endDate,
      parsePagination(query),
    );
  }

  @Get('admin')
  async findAllAdmin(@Req() req: any, @Query() query: any) {
    await this.checkAdmin(req);
    return this.service.findAllAdmin(parsePagination(query));
  }

  @Get('my')
  async findMy(@Req() req: any) {
    const user = await this.requireAuth(req);
    return this.service.findMyEntries(user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const user = await this.getAuthUser(req);
    const createdBy = user.userId || body.createdBy || null;
    return this.service.create({ ...body, createdBy });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const user = await this.getAuthUser(req);
    return this.service.update(id, body, user.userId, user.role);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = await this.getAuthUser(req);
    await this.service.delete(id, user.userId, user.role);
    return { success: true };
  }

  private async getAuthUser(req: any) {
    const authHeader = req.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = await this.authService.validateToken(token);
        return { userId: payload.userId, role: payload.role };
      } catch (err) {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
    return { userId: null, role: 'admin' };
  }

  private async requireAuth(req: any) {
    const user = await this.getAuthUser(req);
    if (!user.userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }

  private async checkAdmin(req: any) {
    const user = await this.getAuthUser(req);
    if (user.role !== 'admin') {
      throw new ForbiddenException('Admin role required');
    }
    return user;
  }
}
