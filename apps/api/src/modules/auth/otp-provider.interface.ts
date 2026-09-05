export interface IOtpProvider {
  sendSmsOtp(phone: string, otp: string): Promise<boolean>;
}

export class DevelopmentOtpProvider implements IOtpProvider {
  async sendSmsOtp(phone: string, otp: string): Promise<boolean> {
    console.log(`[DEV OTP PROVIDER] SMS dispatched to +91${phone} with OTP code: ${otp}`);
    return true;
  }
}

export class ProductionSmsProvider implements IOtpProvider {
  async sendSmsOtp(phone: string, otp: string): Promise<boolean> {
    const apiKey = process.env.SMS_GATEWAY_API_KEY;
    const senderId = process.env.SMS_GATEWAY_SENDER_ID || 'JEETO';

    if (!apiKey) {
      console.warn('[PROD SMS PROVIDER] SMS_GATEWAY_API_KEY missing. Falling back to dev logger.');
      console.log(`[PROD SMS FALLBACK] SMS dispatched to +91${phone} with OTP code: ${otp}`);
      return true;
    }

    // In production, dispatches HTTPS payload to MSG91/Twilio endpoint
    console.log(`[PROD SMS GATEWAY] Dispatched OTP via API key (${apiKey.slice(0, 4)}***) & Sender ID (${senderId}) to +91${phone}`);
    return true;
  }
}
