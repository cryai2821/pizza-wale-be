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

  async getAdminMenu(shopId: string) {
    const categories = await this.prisma.category.findMany({
      where: { shopId },
      include: {
        products: {
          // No isAvailable: true filter here - we want ALL products
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
    const { options, ...productData } = data;

    // Create product with nested relation writes
    return this.prisma.product.create({
      data: {
        ...productData,
        shopId,
        optionConfigs: options?.length
          ? {
              create: options.map((group) => ({
                optionGroup: {
                  create: {
                    name: group.name,
                    minSelect: group.minSelect,
                    maxSelect: group.maxSelect,
                    options: {
                      create: group.options.map((opt) => ({
                        name: opt.name,
                        price: opt.price,
                      })),
                    },
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        optionConfigs: {
          include: {
            optionGroup: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });
  }

  async createCategory(shopId: string, data: { name: string }) {
    return this.prisma.category.create({
      data: {
        name: data.name,
        shopId,
      },
    });
  }

  async updateProduct(
    shopId: string,
    productId: string,
    data: any, // Using any here to handle the DTO -> Input transformation manually
  ) {
    const { options, categoryId, ...productData } = data;

    // Prepare helper for category connection if it changed
    const categoryConnect = categoryId
      ? { category: { connect: { id: categoryId } } }
      : {};

    // If options are provided, we need to replace existing configurations
    if (options) {
      return this.prisma.$transaction(async (tx) => {
        // 1. Remove existing option configurations
        await tx.productOptionConfig.deleteMany({
          where: { productId },
        });

        // 2. Update product and create new configs
        return tx.product.update({
          where: { id: productId, shopId },
          data: {
            ...productData,
            ...categoryConnect,
            optionConfigs: {
              create: options.map((group: any) => ({
                optionGroup: {
                  create: {
                    name: group.name,
                    minSelect: group.minSelect,
                    maxSelect: group.maxSelect,
                    options: {
                      create: group.options.map((opt: any) => ({
                        name: opt.name,
                        price: opt.price,
                      })),
                    },
                  },
                },
              })),
            },
          },
          include: {
             optionConfigs: {
               include: { optionGroup: { include: { options: true } } }
             }
          }
        });
      });
    }

    // Simple update without options
    return this.prisma.product.update({
      where: { id: productId, shopId },
      data: {
        ...productData,
        ...categoryConnect,
      },
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
