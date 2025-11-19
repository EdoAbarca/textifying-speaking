import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';

describe('Auth Registration (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: any;

  beforeEach(async () => {
    // Mock user model for testing
    const mockUserModel = {
      findOne: jest.fn(),
      constructor: jest.fn().mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue({
          _id: 'mockId',
          ...data,
          createdAt: new Date(),
        }),
      })),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getModelToken(User.name))
      .useValue(mockUserModel)
      .compile();

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
    userModel = mockUserModel;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', () => {
      userModel.findOne.mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'User registered successfully');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('username', 'testuser');
          expect(res.body.user).toHaveProperty('email', 'test@example.com');
          expect(res.body.user).not.toHaveProperty('passwordHash');
        });
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('should return 400 for invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 for password shorter than 8 characters', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'short',
        })
        .expect(400);
    });

    it('should return 400 for username shorter than 3 characters', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'ab',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 409 for duplicate email', () => {
      userModel.findOne.mockResolvedValueOnce({
        email: 'test@example.com',
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Email already registered');
        });
    });

    it('should return 409 for duplicate username', () => {
      userModel.findOne
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ username: 'testuser' }); // username check

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Username already taken');
        });
    });
  });
});
