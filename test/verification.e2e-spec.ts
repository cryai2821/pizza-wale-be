import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'nestjs-prisma';
import { App } from 'supertest/types';

describe('Full System Verification (E2E)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let shopId: string;
  let productId: string;
  let userToken: string;

  beforeAll(async () => {
    try {
      console.log('Starting Verification Test Setup...');
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
      prisma = app.get(PrismaService);

      // Fetch Admin Shop
      console.log('Fetching Admin Shop...');
      const shop = await prisma.shop.findUnique({ where: { username: 'admin' } });
      if (!shop) {
        console.error('Shop "admin" not found!');
        throw new Error('Shop not found');
      }
      shopId = shop.id;
      console.log(`Shop found: ${shopId}`);
    } catch (e) {
      console.error('Setup failed:', e);
      throw e;
    }
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('1. Should fetch menu and find "Veg Loaded"', async () => {
    console.log('Test 1: Fetch Menu');
    const res = await request(app.getHttpServer())
      .get(`/shops/${shopId}/menu`)
      .expect(200);

    const categories = res.body;
    expect(Array.isArray(categories)).toBe(true);

    const sigPizza = categories.find((c: any) => c.name === 'Signature Pizza');
    if (!sigPizza) console.error('Signature Pizza category not found');
    expect(sigPizza).toBeDefined();

    const vegLoaded = sigPizza.products.find((p: any) => p.name === 'Veg Loaded');
    if (!vegLoaded) console.error('Veg Loaded product not found');
    expect(vegLoaded).toBeDefined();
    
    productId = vegLoaded.id;
    console.log(`Veg Loaded ID: ${productId}`);
  });

  it('2. Should authenticate user (Guest/OTP)', async () => {
    console.log('Test 2: Auth User');
    // Mock OTP flow
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: '+919999999999' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '+919999999999', otp: '123456' })
      .expect(201);

    userToken = res.body.access_token;
    expect(userToken).toBeDefined();
    console.log('User authenticated');
  });

  it('3. Should create an order with complex options', async () => {
    console.log('Test 3: Create Order');
    // Fetch product again to get options
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { optionConfigs: { include: { optionGroup: { include: { options: true } } } } }
    });

    if (!product) throw new Error('Product not found');

    const sizeGroup = product.optionConfigs.find((c) => c.optionGroup.name === 'Size')?.optionGroup;
    if (!sizeGroup) throw new Error('Size group not found');
    const mediumOpt = sizeGroup.options.find((o) => o.name.includes('Medium'));
    
    const crustGroup = product.optionConfigs.find((c) => c.optionGroup.name.includes('Cheese Burst'))?.optionGroup;
    if (!crustGroup) throw new Error('Crust group not found');
    const burstOpt = crustGroup.options.find((o) => o.name.includes('Medium'));

    if (!mediumOpt || !burstOpt) {
        console.error('Options not found', { mediumOpt, burstOpt });
        throw new Error('Options not found');
    }

    const payload = {
      shopId,
      items: [
        {
          productId,
          quantity: 1,
          options: [
            { optionId: mediumOpt.id },
            { optionId: burstOpt.id }
          ]
        }
      ]
    };

    const res = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload)
      .expect(201);

    const order = res.body;
    expect(order.shortId).toBeDefined();
    
    console.log(`Order Created: ${order.shortId}, Total: ${order.totalAmount}`);
    expect(Number(order.totalAmount)).toBe(305);
  });
});
