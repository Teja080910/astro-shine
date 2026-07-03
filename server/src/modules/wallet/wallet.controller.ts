import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@CurrentUser() userId: string) {
    let wallet = await this.walletService.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await this.walletService.createWallet({ userId });
    }
    return wallet;
  }

  @Post('add-funds')
  async addFunds(@CurrentUser() userId: string, @Body() body: { amount: string }) {
    let wallet = await this.walletService.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await this.walletService.createWallet({ userId });
    }
    return this.walletService.addFunds(wallet.id, body.amount);
  }
}
