import { Controller, Get, Post, Put, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('schedule')
@UseGuards(AuthGuard)
export class ScheduleController {
  constructor(private readonly service: ScheduleService) {}

  @Get(':astrologerId')
  async findByAstrologer(@Param('astrologerId') astrologerId: string) {
    return this.service.findByAstrologer(astrologerId);
  }

  @Post(':astrologerId')
  async upsert(@Param('astrologerId') astrologerId: string, @Body() body: { dayOfWeek: number; startTime: string; endTime: string; isAvailable?: boolean }) {
    return this.service.upsert(astrologerId, body.dayOfWeek, body.startTime, body.endTime, body.isAvailable ?? true);
  }

  @Put(':astrologerId/bulk')
  async bulkUpsert(@Param('astrologerId') astrologerId: string, @Body() body: { schedules: { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }[] }) {
    return this.service.bulkUpsert(astrologerId, body.schedules);
  }
}
