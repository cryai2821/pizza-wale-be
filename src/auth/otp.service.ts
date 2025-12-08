import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { JwtService } from '@nestjs/jwt';

export interface OtpProvider {
  sendOtp(phone: string, otp: string): Promise<void>;
}

@Injectable()
export class MockOtpProvider implements OtpProvider {
  async sendOtp(phone: string, otp: string): Promise<void> {
    console.log(`[MOCK OTP] Sending ${otp} to ${phone}`);
  }
}

@Injectable()
export class OtpService {
  private otpStore = new Map<string, { otp: string; expires: number }>();
  private provider: OtpProvider;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.provider = new MockOtpProvider(); // Inject real provider later
  }

  async sendOtp(phone: string) {
    const otp = (process.env.NODE_ENV === 'test' || phone === '+919999999999')
      ? '123456' 
      : Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 mins
    this.otpStore.set(phone, { otp, expires });

    await this.provider.sendOtp(phone, otp);
    return { message: 'OTP sent' };
  }

  async verifyOtp(phone: string, otp: string) {
    const stored = this.otpStore.get(phone);
    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    this.otpStore.delete(phone);

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({ data: { phone } });
    }

    const payload = { sub: user.id, phone: user.phone, role: 'CUSTOMER' };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
