import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-email-otp')
  async sendEmailOtp(@Body('email') email: string) {
    return this.authService.sendEmailOtp(email);
  }

  @Post('verify-email-otp')
  async verifyEmailOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyEmailOtp(body.email, body.otp);
  }

  @Post('check-phone')
  async checkPhone(@Body('phone') phone: string) {
    return this.authService.checkPhone(phone);
  }

  @Post('phone-login')
  async phoneLogin(@Body('phone') phone: string) {
    return this.authService.loginWithPhone(phone);
  }

  @Post('register')
  async register(@Body() body: { name: string; email: string; password: string; phone?: string }) {
    return this.authService.registerWithEmail(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.loginWithEmail(body.email, body.password);
  }

  @Post('logout')
  async logout() {
    return { success: true, message: 'Logged out successfully' };
  }
}
