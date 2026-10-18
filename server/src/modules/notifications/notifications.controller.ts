import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { parsePagination } from '../../common/utils/pagination';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query('astrologerId') astrologerId?: string,
    @Query() query?: any,
  ) {
    const isAdmin = req.userRole === 'admin';
    if (userId) {
      if (!isAdmin && userId !== req.userId) {
        throw new ForbiddenException('You can only view your own notifications');
      }
      return this.service.findByUserId(userId);
    }
    if (astrologerId) {
      if (!isAdmin && astrologerId !== req.userId) {
        throw new ForbiddenException('You can only view your own notifications');
      }
      return this.service.findByAstrologerId(astrologerId);
    }
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can list all notifications');
    }
    return this.service.findAll(parsePagination(query));
  }

  private async assertCanAccess(id: string, req: any) {
    const notification = await this.service.findById(id);
    if (!notification) return notification;
    if (
      req.userRole !== 'admin' &&
      notification.userId !== req.userId &&
      notification.astrologerId !== req.userId
    ) {
      throw new ForbiddenException('You can only access your own notifications');
    }
    return notification;
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.assertCanAccess(id, req);
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') {
      throw new ForbiddenException('Only admins can create notifications');
    }
    return this.service.create(body);
  }

  @Post('push-token')
  @UseGuards(AuthGuard)
  async registerPushToken(@Req() req: any, @Body() body: { token: string }) {
    if (!body?.token) throw new BadRequestException('token is required');
    return this.service.registerPushToken(req.userId, body.token);
  }

  @Post('push-token/clear')
  @UseGuards(AuthGuard)
  async clearPushToken(@Req() req: any) {
    return this.service.clearPushToken(req.userId);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    await this.assertCanAccess(id, req);
    return this.service.markAsRead(id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(
    @Body() body: { userId?: string; astrologerId?: string },
    @Req() req: any,
  ) {
    if (req.userRole !== 'admin') {
      if (body.userId && body.userId !== req.userId) {
        throw new ForbiddenException('You can only update your own notifications');
      }
      if (body.astrologerId && body.astrologerId !== req.userId) {
        throw new ForbiddenException('You can only update your own notifications');
      }
    }
    await this.service.markAllAsRead(body.userId, body.astrologerId);
  }
}
