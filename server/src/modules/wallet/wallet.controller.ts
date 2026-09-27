import { Controller, Get, Post, Body, UseGuards, Req, Query, ForbiddenException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { parsePagination } from '../../common/utils/pagination';

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@CurrentUser() userId: string, @Req() req: any) {
    const role = req.userRole;
    if (role === 'admin') {
      return this.walletService.getOrCreateAdminWalletFor(userId);
    }
    let wallet = await this.walletService.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await this.walletService.getWalletByAstrologerId(userId);
    }
    if (!wallet) {
      wallet = await this.walletService.createWallet(
        role === 'astrologer' ? { astrologerId: userId } : { userId },
      );
    }
    return wallet;
  }

  @Post('add-funds')
  async addFunds(@Body() body: { walletId: string; amount: string }) {
    return this.walletService.addFunds(body.walletId, body.amount);
  }

  @Get('all')
  @UseGuards(AuthGuard)
  async getAllWallets(@Req() req: any, @Query() query: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can view all wallets');
    const p = parsePagination(query);
    return this.walletService.findAll(p);
  }
}
