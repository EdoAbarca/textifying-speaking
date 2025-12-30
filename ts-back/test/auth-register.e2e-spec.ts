import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Auth Registration (e2e)', () => {
  let app: INestApplication<App>;
  let dbConnection: Connection;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same global pipes as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();
    
    dbConnection = moduleFixture.get<Connection>(getConnectionToken());
    
    // Clean up users collection before each test
    await dbConnection.collection('users').deleteMany({});
  });

  afterEach(async () => {
    await dbConnection.collection('users').deleteMany({});
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', () => {
      const timestamp = Date.now();
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: `testuser_${timestamp}`,
          email: `test_${timestamp}@example.com`,
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'User registered successfully');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('username', `testuser_${timestamp}`);
          expect(res.body.user).toHaveProperty('email', `test_${timestamp}@example.com`);
          expect(res.body.user).not.toHaveProperty('passwordHash');
        });
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `test_${Date.now()}@example.com`,
        })
        .expect(400);
    });

    it('should return 400 for invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: `testuser_${Date.now()}`,
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 for password shorter than 8 characters', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: `testuser_${Date.now()}`,
          email: `test_${Date.now()}@example.com`,
          password: 'short',
        })
        .expect(400);
    });

    it('should return 400 for username shorter than 3 characters', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'ab',
          email: `test_${Date.now()}@example.com`,
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 409 for duplicate email', async () => {
      const timestamp = Date.now();
      const username1 = `testuser_${timestamp}`;
      const username2 = `different_${timestamp}`;
      const email = `test_${timestamp}@example.com`;
      
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: username1,
          email: email,
          password: 'password123',
        })
        .expect(201);

      // Try to register with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: username2,
          email: email,
          password: 'password123',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Email already registered');
        });
    });

    it('should return 409 for duplicate username', async () => {
      const timestamp = Date.now();
      const username = `testuser_${timestamp}`;
      const email1 = `test1_${timestamp}@example.com`;
      const email2 = `test2_${timestamp}@example.com`;
      
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: username,
          email: email1,
          password: 'password123',
        })
        .expect(201);

      // Wait a bit to ensure previous request completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to register with same username
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: username,
          email: email2,
          password: 'password123',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Username already taken');
        });
    });
  });
});
