import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('commissions')
@UseGuards(AuthGuard)
export class CommissionController {
  constructor(private readonly service: CommissionService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get('logs')
  async getLogs(
    @Query('astrologerId') astrologerId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.service.getLogs(astrologerId, page || 1, limit || 20); }

  @Get('stats/:astrologerId')
  async getAstrologerStats(@Param('astrologerId') astrologerId: string) { return this.service.getAstrologerStats(astrologerId); }

  @Get('by-astrologer/:astrologerId')
  async findByAstrologerId(@Param('astrologerId') astrologerId: string) { return this.service.findByAstrologerId(astrologerId); }

  @Post()
  async create(@Body() body: any, @Req() req: any) { return this.service.create(body); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.service.update(id, body); }
}
