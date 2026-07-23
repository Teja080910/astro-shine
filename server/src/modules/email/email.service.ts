import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isDevMode: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY', '');
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL', 'noreply@astroshine.com');
    this.fromName = this.configService.get<string>('RESEND_FROM_NAME', 'Astro Shine');
    this.isDevMode = this.configService.get<string>('NODE_ENV') !== 'production';
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    if (this.isDevMode) {
      this.logger.log(`[DEV] Email OTP for ${email}: ${otp}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Your OTP for Astro Shine',
        html: this.getOtpEmailTemplate(otp),
      });
      this.logger.log(`OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}: ${error.message}`);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    if (this.isDevMode) {
      this.logger.log(`[DEV] Welcome email for ${name} <${email}>`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Welcome to Astro Shine!',
        html: this.getWelcomeEmailTemplate(name),
      });
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}: ${error.message}`);
    }
  }

  private getOtpEmailTemplate(otp: string): string {
    return `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #09090B; border-radius: 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #FFFFFF; font-size: 24px; margin: 0;">Astro Shine</h1>
        </div>
        <div style="background: rgba(255,255,255,0.08); border-radius: 18px; padding: 32px; text-align: center;">
          <p style="color: #B6B6C2; font-size: 14px; margin: 0 0 16px;">Your verification code</p>
          <div style="font-size: 40px; font-weight: 700; color: #A855F7; letter-spacing: 8px; margin: 16px 0;">${otp}</div>
          <p style="color: #B6B6C2; font-size: 13px; margin: 16px 0 0;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      </div>
    `;
  }

  private getWelcomeEmailTemplate(name: string): string {
    return `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #09090B; border-radius: 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #FFFFFF; font-size: 24px; margin: 0;">Astro Shine</h1>
        </div>
        <div style="background: rgba(255,255,255,0.08); border-radius: 18px; padding: 32px;">
          <h2 style="color: #FFFFFF; font-size: 20px; margin: 0 0 8px;">Welcome, ${name}! ✨</h2>
          <p style="color: #B6B6C2; font-size: 14px; line-height: 1.6; margin: 0;">
            Thank you for joining Astro Shine. Explore your cosmic journey with live astrologers, 
            daily horoscopes, kundli matching, and more.
          </p>
        </div>
      </div>
    `;
  }
}
