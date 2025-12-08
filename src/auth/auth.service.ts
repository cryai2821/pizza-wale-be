import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateShop(username: string, pass: string): Promise<any> {
    const shop = await this.prisma.shop.findUnique({
      where: { username },
    });
    if (shop && (await bcrypt.compare(pass, shop.password))) {
      const { password, ...result } = shop;
      return result;
    }
    return null;
  }

  async loginShop(shop: any) {
    const payload = {
      username: shop.username,
      sub: shop.id,
      role: 'SHOP_OWNER',
      shopId: shop.id,
    };
    return {
      access_token: this.jwtService.sign(payload),
      shop: {
        id: shop.id,
        name: shop.name,
        username: shop.username,
      },
    };
  }
}
