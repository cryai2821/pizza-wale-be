/* eslint-disable */

import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from 'nestjs-prisma';
import { FirestoreService } from '../firestore/firestore.service';
import { BadRequestException } from '@nestjs/common';

const mockPrismaService = {
  product: {
    findMany: jest.fn(),
  },
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockFirestoreService = {
  updateOrder: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: typeof mockPrismaService;
  let firestore: typeof mockFirestoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FirestoreService, useValue: mockFirestoreService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);
    firestore = module.get(FirestoreService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    const mockUser = { sub: 'user-1', phone: '1234567890' };
    const mockCreateOrderDto = {
      shopId: 'shop-1',
      items: [
        {
          productId: 'prod-1',
          quantity: 2,
          options: [{ optionId: 'opt-1' }],
        },
      ],
    };

    const mockProduct = {
      id: 'prod-1',
      name: 'Pizza',
      basePrice: 100,
      shopId: 'shop-1',
      optionConfigs: [
        {
          isEnabled: true,
          optionGroup: {
            options: [{ id: 'opt-1', price: 50 }],
          },
        },
      ],
    };

    it('should create an order with correct total amount', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct] as any);
      prisma.order.create.mockResolvedValue({
        id: 'order-1',
        status: 'PENDING',
        totalAmount: 300, // (100 + 50) * 2
        items: [],
      });

      const result = await service.createOrder(mockCreateOrderDto, mockUser);

      expect(prisma.product.findMany).toHaveBeenCalled();
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 300,
            userId: mockUser.sub,
          }),
        }),
      );
      expect(firestore.updateOrder).toHaveBeenCalledWith(
        'order-1',
        expect.anything(),
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if product not found', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await expect(
        service.createOrder(mockCreateOrderDto, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if option is invalid', async () => {
      const invalidOptionProduct = {
        ...mockProduct,
        optionConfigs: [], // No options configured
      };
      prisma.product.findMany.mockResolvedValue([invalidOptionProduct] as any);

      await expect(
        service.createOrder(mockCreateOrderDto, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should update order status and project to firestore', async () => {
      const orderId = 'order-1';
      const status = 'CONFIRMED';
      const mockOrder = { id: orderId, status };

      prisma.order.update.mockResolvedValue(mockOrder as any);

      const result = await service.updateStatus(orderId, status);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status },
      });
      expect(firestore.updateOrder).toHaveBeenCalledWith(orderId, { status });
      expect(result).toEqual(mockOrder);
    });
  });
});
