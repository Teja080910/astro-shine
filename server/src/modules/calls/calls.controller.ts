import { Controller, Get, Post, Param, Body, Query, Put, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { CallsService } from './calls.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { parsePagination } from '../../common/utils/pagination';

@Controller('calls')
@UseGuards(AuthGuard)
export class CallsController {
  constructor(private readonly service: CallsService) {}

  @Get()
  async findAll(@Query('userId') userId?: string, @Query('astrologerId') astrologerId?: string, @Query() query?: any, @Req() req?: any) {
    const p = parsePagination(query);
    if (userId) {
      if (req?.userRole !== 'admin' && req?.userId !== userId) throw new ForbiddenException('Cannot view another user call logs');
      return this.service.findByUserId(userId, p);
    }
    if (astrologerId) {
      if (req?.userRole !== 'admin' && req?.userId !== astrologerId) throw new ForbiddenException('Cannot view another astrologer call logs');
      return this.service.findByAstrologerId(astrologerId, p);
    }
    if (req?.userRole !== 'admin') throw new ForbiddenException('Only admins can view all call logs');
    return this.service.findAll(p);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) { return this.service.updateStatus(id, body.status); }
}
