import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  async sendOtp(@Body('phone') phone: string) {
    return this.authService.sendOtp(phone);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { phone: string; otp: string }) {
    return this.authService.verifyOtp(body.phone, body.otp);
  }

  @Post('register')
  async register(@Body() body: { name: string; email: string; password: string; phone?: string }) {
    return this.authService.registerWithEmail(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.loginWithEmail(body.email, body.password);
  }
}
