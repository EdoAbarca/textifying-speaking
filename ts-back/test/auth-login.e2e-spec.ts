import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('AuthController /auth/login (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;

  // Test user data
  const testUser = {
    username: 'logintest',
    email: 'logintest@example.com',
    password: 'testpass123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());
  });

  beforeEach(async () => {
    // Clear the users collection before each test
    const collections = mongoConnection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    // Register a test user for login tests
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);
  });

  afterAll(async () => {
    // Clean up and close connections
    const collections = mongoConnection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    await mongoConnection.close();
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).toBeTruthy();
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('username', testUser.username);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'User with such email does not exist');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Password doesn\'t match');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: testUser.password,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: testUser.password,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return 400 for empty credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });
  });
});
