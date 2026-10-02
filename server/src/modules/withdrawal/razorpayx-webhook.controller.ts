import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WithdrawalService } from './withdrawal.service';

@Controller('withdrawals/webhook')
export class RazorpayxWebhookController {
  constructor(private readonly service: WithdrawalService) {}

  @Post('razorpayx')
  @HttpCode(HttpStatus.OK)
  handlePayoutWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.service.handlePayoutWebhook(
      req.body,
      signature,
      req.rawBody,
    );
  }
}
