import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateProductDto } from './dto/create-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  async getMenu(shopId: string) {
    const categories = await this.prisma.category.findMany({
      where: { shopId },
      include: {
        products: {
          where: { isAvailable: true },
          include: {
            optionConfigs: {
              where: { isEnabled: true },
              include: { optionGroup: { include: { options: true } } },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return categories;
  }

  async createProduct(shopId: string, data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...data,
        shopId,
      },
    });
  }

  async updateProduct(
    shopId: string,
    productId: string,
    data: Prisma.ProductUpdateInput,
  ) {
    return this.prisma.product.update({
      where: { id: productId, shopId },
      data,
    });
  }

  async getOrders(shopId: string) {
    return this.prisma.order.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
            selectedOptions: {
              include: {
                option: true,
              },
            },
          },
        },
      },
      take: 50, // Limit to last 50 orders for dashboard
    });
  }
}
