import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { LiveSessionsService } from './live-sessions.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('live-sessions')
export class LiveSessionsController {
  constructor(private readonly service: LiveSessionsService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get('live')
  async findLive() { return this.service.findLive(); }

  @Get('astrologer/:astrologerId')
  async findByAstrologerId(@Param('astrologerId') astrologerId: string) { return this.service.findByAstrologerId(astrologerId); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can create live sessions');
    return this.service.create(body);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard)
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can update session status');
    return this.service.updateStatus(id, body.status);
  }
}
