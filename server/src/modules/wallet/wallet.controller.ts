import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@CurrentUser() userId: string, @Req() req: any) {
    const role = req.userRole;
    let wallet;
    if (role === 'admin') {
      wallet = await this.walletService.getWalletByAdminId(userId);
    } else {
      wallet = await this.walletService.getWalletByUserId(userId);
      if (!wallet) {
        wallet = await this.walletService.getWalletByAstrologerId(userId);
      }
    }
    if (!wallet) {
      wallet = await this.walletService.createWallet(
        role === 'astrologer' ? { astrologerId: userId } : { userId },
      );
    }
    return wallet;
  }

  @Get('all')
  async getAllWallets() {
    return this.walletService.findAll();
  }
}
