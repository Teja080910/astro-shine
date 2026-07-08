const MSG91_WIDGET_BASE_URL = 'https://control.msg91.com/api/v5/widget';

let widgetId = '';
let tokenAuth = '';

function sanitizeEnvValue(value: string) {
  const trimmed = value.trim();
  return trimmed.replace(/^['"]|['"]$/g, '');
}

function ensureInitialized() {
  if (!widgetId || !tokenAuth) {
    throw new Error('OTP widget configuration is missing');
  }
}

async function post<T = any>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${MSG91_WIDGET_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json() as Promise<T>;
}

export class OTPWidget {
  static initializeWidget(nextWidgetId: string, nextTokenAuth: string) {
    widgetId = sanitizeEnvValue(nextWidgetId || '');
    tokenAuth = sanitizeEnvValue(nextTokenAuth || '');
  }

  static isConfigured() {
    return Boolean(widgetId && tokenAuth);
  }

  static async sendOTP(body: Record<string, unknown>) {
    ensureInitialized();
    return post('/sendOtpMobile', { widgetId, tokenAuth, ...body });
  }

  static async verifyOTP(body: Record<string, unknown>) {
    ensureInitialized();
    return post('/verifyOtp', { widgetId, tokenAuth, ...body });
  }

  static async retryOTP(body: Record<string, unknown>) {
    ensureInitialized();
    return post('/retryOtp', { widgetId, tokenAuth, ...body });
  }
}
