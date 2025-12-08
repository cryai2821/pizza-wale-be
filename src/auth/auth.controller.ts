import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { OtpService } from './otp.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private otpService: OtpService,
  ) {}

  @UseGuards(AuthGuard('local'))
  @Post('shop/login')
  async shopLogin(@Request() req) {
    return this.authService.loginShop(req.user);
  }

  @Post('otp/send')
  async sendOtp(@Body('phone') phone: string) {
    return this.otpService.sendOtp(phone);
  }

  @Post('otp/verify')
  async verifyOtp(@Body('phone') phone: string, @Body('otp') otp: string) {
    return this.otpService.verifyOtp(phone, otp);
  }
}
