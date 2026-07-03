import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';

@Controller('matchmaking')
export class MatchmakingController {
  constructor(private readonly service: MatchmakingService) {}

  @Get()
  async findByUser(@Query('userId') userId: string) { return userId ? this.service.findByUserId(userId) : []; }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }
}
