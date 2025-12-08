import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { FirestoreService } from './../src/firestore/firestore.service';
import { JwtService } from '@nestjs/jwt';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockFirestoreService = {
    updateOrder: jest.fn(),
    onModuleInit: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FirestoreService)
      .useValue(mockFirestoreService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = app.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/orders (POST)', async () => {
    const token = jwtService.sign({
      sub: 'user-e2e',
      phone: '+1234567890',
      role: 'CUSTOMER',
    });

    // Use seeded data IDs
    const shopId = '630f4828-f130-4e8d-9038-c9e3361d43fc'; // From seed
    const productId = '0679c2f4-7b00-4d67-8863-ebdafc756d0e'; // From DB fetch

    // Note: If seed data is different, this test might fail.
    // Ideally we should fetch a product first, but for MVP this is fine.

    const createOrderDto = {
      shopId,
      items: [
        {
          productId,
          quantity: 1,
          options: [],
        },
      ],
    };

    return request(app.getHttpServer() as unknown as App)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(createOrderDto)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('status', 'PENDING');
        expect(res.body).toHaveProperty('totalAmount');
      });
  });
});
