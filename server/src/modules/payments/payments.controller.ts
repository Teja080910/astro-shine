import {
  Controller, Get, Post, Body, Param, Headers, Req,
  UseGuards, HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @UseGuards(AuthGuard)
  async createOrder(
    @CurrentUser() userId: string,
    @Body() body: { amount: number; purpose: string; metadata?: Record<string, any> },
  ) {
    return this.paymentsService.createOrder(userId, body.amount, body.purpose, body.metadata);
  }

  @Post('verify')
  @UseGuards(AuthGuard)
  async verifyPayment(
    @CurrentUser() userId: string,
    @Body() body: {
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
    },
  ) {
    return this.paymentsService.verifyPayment(
      userId,
      body.razorpayPaymentId,
      body.razorpayOrderId,
      body.razorpaySignature,
    );
  }

  @Get(':id/status')
  @UseGuards(AuthGuard)
  async getPaymentStatus(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.paymentsService.getPaymentStatus(id, userId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.body, signature);
  }

  @Post(':id/refund')
  @UseGuards(AuthGuard)
  async refundPayment(
    @Param('id') id: string,
    @Body() body: { amount?: number; reason?: string },
  ) {
    return this.paymentsService.refundPayment(id, body.amount, body.reason);
  }
}
