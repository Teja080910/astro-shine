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
  UseGuards,
} from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import { parsePagination } from '../../common/utils/pagination';

@Controller('gifts')
@UseGuards(AuthGuard, RoleGuard)
export class GiftsController {
  constructor(private readonly service: GiftsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.service.findAll(parsePagination(query));
  }

  @Get('transactions')
  async getTransactions(
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query() query?: any,
  ) {
    return this.service.getGiftTransactions(
      req.userId,
      req.userRole,
      userId,
      parsePagination(query),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('admin')
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Post('send')
  async sendGift(
    @Body() body: { giftId: string; receiverId: string },
    @Req() req: any,
  ) {
    return this.service.sendGift({
      giftId: body.giftId,
      receiverId: body.receiverId,
      senderId: req.userId,
    });
  }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Put('transactions/:id/redeem')
  async redeem(@Param('id') id: string, @Req() req: any) {
    return this.service.redeemGift(id, req.userId, req.userRole);
  }
}
