import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Get()
  async findAll(@Query('astrologerId') astrologerId?: string, @Query('userId') userId?: string) {
    if (astrologerId) return this.service.findByAstrologerId(astrologerId);
    if (userId) return this.service.findByUserId(userId);
    return [];
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any) { return this.service.create(body); }

  @Put(':id/visibility')
  async toggleVisibility(@Param('id') id: string, @Body() body: { isVisible: boolean }) { return this.service.toggleVisibility(id, body.isVisible); }
}
