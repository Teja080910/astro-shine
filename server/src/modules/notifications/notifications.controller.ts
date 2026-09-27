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
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { parsePagination } from '../../common/utils/pagination';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('astrologerId') astrologerId?: string,
    @Query() query?: any,
  ) {
    if (userId) return this.service.findByUserId(userId);
    if (astrologerId) return this.service.findByAstrologerId(astrologerId);
    return this.service.findAll(parsePagination(query));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  async create(@Body() body: any) {
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
  async markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(
    @Body() body: { userId?: string; astrologerId?: string },
  ) {
    await this.service.markAllAsRead(body.userId, body.astrologerId);
  }
}
