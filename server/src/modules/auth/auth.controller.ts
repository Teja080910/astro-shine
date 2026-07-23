import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-email-otp')
  async sendEmailOtp(@Body('email') email: string) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Valid email is required');
    return this.authService.sendEmailOtp(email);
  }

  @Post('verify-email-otp')
  async verifyEmailOtp(@Body() body: { email: string; otp: string }) {
    if (!body.email || !body.otp) throw new BadRequestException('Email and OTP are required');
    return this.authService.verifyEmailOtp(body.email, body.otp);
  }

  @Post('check-phone')
  async checkPhone(@Body('phone') phone: string) {
    if (!phone || phone.length < 10) throw new BadRequestException('Valid phone number is required');
    return this.authService.checkPhone(phone);
  }

  @Post('send-phone-otp')
  async sendPhoneOtp(@Body('phone') phone: string) {
    if (!phone || phone.length < 10) throw new BadRequestException('Valid phone number is required');
    return this.authService.sendPhoneOtp(phone);
  }

  @Post('phone-login')
  async phoneLogin(@Body() body: { phone: string; otp: string }) {
    if (!body.phone || body.phone.length < 10) throw new BadRequestException('Valid phone number is required');
    if (!body.otp) throw new BadRequestException('OTP is required');
    return this.authService.loginWithPhone(body.phone, body.otp);
  }

  @Post('send-registration-otp')
  async sendRegistrationOtp(@Body() body: { identifier: string; type: 'email' | 'phone' }) {
    if (!body.identifier) throw new BadRequestException('Identifier is required');
    if (!['email', 'phone'].includes(body.type)) throw new BadRequestException('Type must be email or phone');
    return this.authService.sendRegistrationOtp(body.identifier, body.type);
  }

  @Post('verify-registration-otp')
  async verifyRegistrationOtp(@Body() body: { identifier: string; type: 'email' | 'phone'; otp: string }) {
    if (!body.identifier || !body.otp) throw new BadRequestException('Identifier and OTP are required');
    if (!['email', 'phone'].includes(body.type)) throw new BadRequestException('Type must be email or phone');
    return this.authService.verifyRegistrationOtp(body.identifier, body.type, body.otp);
  }

  @Post('register')
  async register(@Body() body: { name: string; email: string; password: string; phone?: string }) {
    if (!body.name || body.name.length < 2) throw new BadRequestException('Name must be at least 2 characters');
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) throw new BadRequestException('Valid email is required');
    if (!body.password || body.password.length < 6) throw new BadRequestException('Password must be at least 6 characters');
    return this.authService.registerWithEmail(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) throw new BadRequestException('Email and password are required');
    return this.authService.loginWithEmail(body.email, body.password);
  }

  @Post('logout')
  async logout() {
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('forgot-password/send-otp')
  async sendForgotPasswordOtp(@Body() body: { identifier: string; type: 'email' | 'phone' }) {
    if (!body.identifier) throw new BadRequestException('Identifier is required');
    if (!['email', 'phone'].includes(body.type)) throw new BadRequestException('Type must be email or phone');
    if (body.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.identifier)) throw new BadRequestException('Valid email is required');
    if (body.type === 'phone' && body.identifier.length < 10) throw new BadRequestException('Valid phone number is required');
    return this.authService.sendForgotPasswordOtp(body.identifier, body.type);
  }

  @Post('forgot-password/reset')
  async resetPassword(@Body() body: { identifier: string; type: 'email' | 'phone'; otp: string; newPassword: string }) {
    if (!body.identifier || !body.otp || !body.newPassword) throw new BadRequestException('Identifier, OTP and new password are required');
    if (!['email', 'phone'].includes(body.type)) throw new BadRequestException('Type must be email or phone');
    return this.authService.resetPassword(body.identifier, body.otp, body.newPassword, body.type);
  }
}
