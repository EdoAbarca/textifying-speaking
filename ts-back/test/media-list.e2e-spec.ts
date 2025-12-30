import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './../src/users/schemas/user.schema';
import { MediaFile } from './../src/media/schemas/media-file.schema';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('GET /media (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let mediaFileModel: Model<MediaFile>;
  let accessToken: string;
  let userId: string;
  let otherUserId: string;
  let otherAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    mediaFileModel = moduleFixture.get<Model<MediaFile>>(
      getModelToken(MediaFile.name),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database
    await userModel.deleteMany({});
    await mediaFileModel.deleteMany({});

    const unique = Date.now();

    // Register and login first user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: `testuser${unique}`,
        email: `test${unique}@example.com`,
        password: 'password123',
      })
      .expect(201);

    userId = registerResponse.body.user.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `test${unique}@example.com`,
        password: 'password123',
      })
      .expect(200);

    accessToken = loginResponse.body.accessToken;

    // Register and login second user
    const otherRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: `otheruser${unique}`,
        email: `other${unique}@example.com`,
        password: 'password123',
      })
      .expect(201);

    otherUserId = otherRegisterResponse.body.user.id;

    const otherLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `other${unique}@example.com`,
        password: 'password123',
      })
      .expect(200);

    otherAccessToken = otherLoginResponse.body.accessToken;
  });

  describe('GET /media', () => {
    it('should return empty array when user has no files', () => {
      return request(app.getHttpServer())
        .get('/media')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.files).toBeDefined();
          expect(res.body.files).toBeInstanceOf(Array);
          expect(res.body.files).toHaveLength(0);
        });
    });

    it('should return all files for authenticated user', async () => {
      // Create test files
      const file1 = new mediaFileModel({
        userId,
        filename: 'file-123.mp3',
        originalFilename: 'test1.mp3',
        mimetype: 'audio/mpeg',
        path: '/uploads/file-123.mp3',
        size: 1024,
        uploadDate: new Date(),
        status: 'ready',
      });
      await file1.save();

      const file2 = new mediaFileModel({
        userId,
        filename: 'file-456.mp3',
        originalFilename: 'test2.mp3',
        mimetype: 'audio/mpeg',
        path: '/uploads/file-456.mp3',
        size: 2048,
        uploadDate: new Date(),
        status: 'ready',
      });
      await file2.save();

      return request(app.getHttpServer())
        .get('/media')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.files).toBeDefined();
          expect(res.body.files).toHaveLength(2);
          expect(res.body.files[0]).toHaveProperty('id');
          expect(res.body.files[0]).toHaveProperty('filename');
          expect(res.body.files[0]).toHaveProperty('originalFilename');
          expect(res.body.files[0]).toHaveProperty('mimetype');
          expect(res.body.files[0]).toHaveProperty('size');
          expect(res.body.files[0]).toHaveProperty('uploadDate');
          expect(res.body.files[0]).toHaveProperty('status');
        });
    });

    it('should only return files belonging to authenticated user', async () => {
      // Create files for first user
      const file1 = new mediaFileModel({
        userId,
        filename: 'file-user1.mp3',
        originalFilename: 'user1.mp3',
        mimetype: 'audio/mpeg',
        path: '/uploads/file-user1.mp3',
        size: 1024,
        uploadDate: new Date(),
        status: 'ready',
      });
      await file1.save();

      // Create files for second user
      const file2 = new mediaFileModel({
        userId: otherUserId,
        filename: 'file-user2.mp3',
        originalFilename: 'user2.mp3',
        mimetype: 'audio/mpeg',
        path: '/uploads/file-user2.mp3',
        size: 2048,
        uploadDate: new Date(),
        status: 'ready',
      });
      await file2.save();

      return request(app.getHttpServer())
        .get('/media')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.files).toHaveLength(1);
          expect(res.body.files[0].filename).toBe('file-user1.mp3');
        });
    });

    it('should return 401 if no token provided', () => {
      return request(app.getHttpServer())
        .get('/media')
        .expect(401);
    });

    it('should return 401 if invalid token provided', () => {
      return request(app.getHttpServer())
        .get('/media')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
