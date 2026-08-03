import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly otpTemplateId: string;
  private readonly senderId: string;
  private readonly widgetId: string;
  private readonly tokenAuth: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('MSG91_API_KEY') || '';
    this.otpTemplateId = this.configService.get<string>('MSG91_OTP_TEMPLATE_ID') || '';
    this.senderId = this.configService.get<string>('MSG91_SENDER_ID') || 'MSGIND';
    this.widgetId = this.configService.get<string>('MSG91_WIDGET_ID') || '';
    this.tokenAuth = this.configService.get<string>('MSG91_TOKEN_AUTH') || '';
  }

  private toMsg91Mobile(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, '');
    const localNumber =
      digitsOnly.length === 12 && digitsOnly.startsWith('91')
        ? digitsOnly.slice(2)
        : digitsOnly.length > 10
          ? digitsOnly.slice(-10)
          : digitsOnly;
    return `91${localNumber}`;
  }

  async sendOtp(phone: string, _otp: string): Promise<string | null> {
    const mobile = this.toMsg91Mobile(phone);

    // Try widget API (sends OTP via MSG91 - MSG91 generates the OTP, not us)
    if (this.widgetId && this.tokenAuth) {
      try {
        const { default: axios } = await import('axios');
        const payload = {
          widgetId: this.widgetId,
          tokenAuth: this.tokenAuth,
          identifier: mobile,
        };

        this.logger.log(`MSG91 Widget API payload: ${JSON.stringify(payload)}`);

        const response = await axios.post(
          'https://control.msg91.com/api/v5/widget/sendOtpMobile',
          payload,
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );

        this.logger.log(`MSG91 Widget API response: ${JSON.stringify(response.data)}`);

        if (response.data?.type === 'success' && response.data?.message) {
          const reqId = response.data.message;
          this.logger.log(`OTP sent via MSG91 Widget to ${phone}, reqId: ${reqId}`);
          return reqId;
        }

        this.logger.warn('MSG91 Widget API did not return success', { response: response.data });
      } catch (error: any) {
        this.logger.warn('MSG91 Widget API failed:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
      }
    }

    // Fallback: try Flow API
    try {
      const { default: axios } = await import('axios');
      const flowPayload = {
        template_id: this.otpTemplateId,
        sender: this.senderId,
        short_url: '0',
        mobiles: mobile,
        VAR: _otp,
      };

      const flowResponse = await axios.post(
        'https://control.msg91.com/api/v5/flow',
        flowPayload,
        {
          headers: {
            authkey: this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`MSG91 Flow API response: ${JSON.stringify(flowResponse.data)}`);

      if (flowResponse.data?.type === 'success') {
        this.logger.log(`OTP sent via MSG91 Flow to ${phone}`);
        return 'flow';
      }

      this.logger.error('MSG91 Flow API also failed:', { response: flowResponse.data });
    } catch (error: any) {
      this.logger.error('Failed to send OTP via MSG91 Flow:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    return null;
  }

  async verifyWidgetOtp(reqId: string, otp: string): Promise<boolean> {
    if (!this.widgetId || !this.tokenAuth) {
      this.logger.warn('MSG91 widget credentials missing. Cannot verify OTP.');
      return false;
    }

    try {
      const { default: axios } = await import('axios');
      const payload = { widgetId: this.widgetId, tokenAuth: this.tokenAuth, reqId, otp };

      const response = await axios.post(
        'https://control.msg91.com/api/v5/widget/verifyOtp',
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      this.logger.log(`MSG91 Widget verify response: ${JSON.stringify(response.data)}`);

      return response.data?.type === 'success';
    } catch (error: any) {
      this.logger.error('Failed to verify OTP via MSG91 Widget:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return false;
    }
  }
}
