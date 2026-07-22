import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reviews')
@UseGuards(AuthGuard)
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Get()
  async findAll(@Query('astrologerId') astrologerId?: string, @Query('userId') userId?: string) {
    if (astrologerId) return this.service.findByAstrologerId(astrologerId);
    if (userId) return this.service.findByUserId(userId);
    return this.service.findAllReviews();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    body.userId = req.userId;
    return this.service.create(body);
  }

  @Put(':id/visibility')
  async toggleVisibility(@Param('id') id: string, @Body() body: { isVisible: boolean }, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can toggle review visibility');
    return this.service.toggleVisibility(id, body.isVisible);
  }
}
