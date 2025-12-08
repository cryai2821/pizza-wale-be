import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { FirestoreService } from './../src/firestore/firestore.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/shop/login (POST)', () => {
    return request(app.getHttpServer() as unknown as App)
      .post('/auth/shop/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
      });
  });

  it('/auth/otp/send (POST)', () => {
    return request(app.getHttpServer() as unknown as App)
      .post('/auth/otp/send')
      .send({ phone: '+1234567890' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('message', 'OTP sent');
      });
  });
});
