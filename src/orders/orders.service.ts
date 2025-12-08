import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { FirestoreService } from '../firestore/firestore.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

export interface UserPayload {
  sub: string;
  phone: string;
}

interface SelectedOptionData {
  optionId: string;
  price: number | import('@prisma/client/runtime/library').Decimal;
}

interface OrderItemData {
  productId: string;
  quantity: number;
  price: number;
  selectedOptions: SelectedOptionData[];
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private firestore: FirestoreService,
  ) {}

  async createOrder(data: CreateOrderDto, user: UserPayload) {
    const { shopId, items } = data;

    // 1. Fetch all products and options
    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, shopId },
      include: {
        optionConfigs: {
          where: { isEnabled: true },
          include: { optionGroup: { include: { options: true } } },
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products not found or unavailable');
    }

    // 2. Calculate Totals & Validate
    let totalAmount = 0;
    const orderItemsData: OrderItemData[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      let itemPrice = Number(product.basePrice);
      const selectedOptionsData: SelectedOptionData[] = [];

      // Validate Options
      if (item.options) {
        for (const opt of item.options) {
          const config = product.optionConfigs.find((c) =>
            c.optionGroup.options.some((o) => o.id === opt.optionId),
          );
          if (!config)
            throw new BadRequestException(
              `Invalid option ${opt.optionId} for product ${product.name}`,
            );

          const optionGroup = config.optionGroup;
          const optionDef = optionGroup.options.find(
            (o) => o.id === opt.optionId,
          );

          if (optionDef) {
            itemPrice += Number(optionDef.price);
            selectedOptionsData.push({
              optionId: optionDef.id,
              price: optionDef.price,
            });
          }
        }
      }

      totalAmount += itemPrice * item.quantity;
      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: itemPrice,
        selectedOptions: selectedOptionsData,
      });
    }

    // 3. Create Order
    const order = await this.prisma.order.create({
      data: {
        shortId: Math.floor(1000 + Math.random() * 9000).toString(),
        shopId,
        userId: user?.sub,
        guestPhone: user?.phone,
        totalAmount,
        status: 'PENDING',
        items: {
          create: orderItemsData.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            selectedOptions: {
              create: item.selectedOptions,
            },
          })),
        },
      },
      include: { items: { include: { selectedOptions: true } } },
    });

    // 4. Project to Firestore
    await this.firestore.updateOrder(order.id, {
      shopId: order.shopId,
      userId: order.userId,
      status: order.status,
      totalAmount: Number(order.totalAmount), // Convert Decimal to number
      shortId: order.shortId,
      items: order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      guestPhone: order.guestPhone,
      updatedAt: new Date(),
    });

    return order;
  }

  async getOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    await this.firestore.updateOrder(order.id, { status });
    return order;
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
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
        shop: {
          select: {
            name: true,
          },
        },
      },
    });
  }
}
