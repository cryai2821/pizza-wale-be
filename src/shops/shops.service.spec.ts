/* eslint-disable */

import { Test, TestingModule } from '@nestjs/testing';
import { ShopsService } from './shops.service';
import { PrismaService } from 'nestjs-prisma';

const mockPrismaService = {
  category: {
    findMany: jest.fn(),
  },
  product: {
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('ShopsService', () => {
  let service: ShopsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ShopsService>(ShopsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMenu', () => {
    it('should return categories with products', async () => {
      const shopId = 'shop-1';
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Pizza',
          products: [{ id: 'prod-1', name: 'Margherita' }],
        },
      ];

      prisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.getMenu(shopId);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shopId },
          include: expect.anything(),
        }),
      );
      expect(result).toEqual(mockCategories as any);
    });
  });

  describe('createProduct', () => {
    it('should create a product linked to the shop', async () => {
      const shopId = 'shop-1';
      const createProductDto = {
        name: 'New Pizza',
        basePrice: 200,
        categoryId: 'cat-1',
      };
      const mockProduct = { id: 'prod-new', ...createProductDto, shopId };

      prisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.createProduct(shopId, createProductDto);

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: { ...createProductDto, shopId },
      });
      expect(result).toEqual(mockProduct);
    });
  });
});
