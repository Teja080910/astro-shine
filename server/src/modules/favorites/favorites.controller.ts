import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('favorites')
@UseGuards(AuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async getFavorites(@CurrentUser() userId: string) {
    return this.favoritesService.listUserFavorites(userId);
  }

  @Post('toggle/:astrologerId')
  async toggleFavorite(
    @CurrentUser() userId: string,
    @Param('astrologerId') astrologerId: string,
  ) {
    return this.favoritesService.toggleFavorite(userId, astrologerId);
  }

  @Get('status/:astrologerId')
  async checkFavorite(
    @CurrentUser() userId: string,
    @Param('astrologerId') astrologerId: string,
  ) {
    return this.favoritesService.checkFavoriteStatus(userId, astrologerId);
  }
}
