import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Media Status E2E Tests', () => {
  let app: INestApplication<App>;
  let connection: Connection;
  let authToken: string;
  let userId: string;
  let fileId: string;

  beforeAll(async () => {
    // Set environment variables for testing
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';
    process.env.MEDIA_STORAGE_PATH = './test-uploads';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    const collections = connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('PATCH /media/:id/status', () => {
    beforeEach(async () => {
      // Register and login a user
      const timestamp = Date.now();
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: `testuser_${timestamp}`,
          email: `test_${timestamp}@example.com`,
          password: 'password123',
        })
        .expect(201);

      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `test_${timestamp}@example.com`,
          password: 'password123',
        })
        .expect(200);

      expect(loginResponse.status).toBe(200);
      authToken = loginResponse.body.accessToken;
      userId = loginResponse.body.user.id;

      // Upload a file
      const uploadResponse = await request(app.getHttpServer())
        .post('/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake audio content'), {
          filename: 'test.mp3',
          contentType: 'audio/mpeg',
        });

      expect(uploadResponse.status).toBe(201);
      fileId = uploadResponse.body.file.id;
    });

    it('should update file status to processing', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/media/${fileId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'processing',
          progress: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('File status updated successfully');
      expect(response.body.file.status).toBe('processing');
      expect(response.body.file.progress).toBe(50);
    });

    it('should update file status to completed', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/media/${fileId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'completed',
          progress: 100,
        });

      expect(response.status).toBe(200);
      expect(response.body.file.status).toBe('completed');
      expect(response.body.file.progress).toBe(100);
    });

    it('should update file status to error with error message', async () => {
      const errorMessage = 'Transcription failed due to invalid format';
      const response = await request(app.getHttpServer())
        .patch(`/media/${fileId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'error',
          errorMessage,
        });

      expect(response.status).toBe(200);
      expect(response.body.file.status).toBe('error');
      expect(response.body.file.errorMessage).toBe(errorMessage);
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/media/${fileId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'invalid_status',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid status value');
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app.getHttpServer())
        .patch('/media/507f1f77bcf86cd799439011/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'processing',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('File not found');
    });

    it('should return 403 when updating status of another user\'s file', async () => {
      // Register and login a second user
      const timestamp = Date.now();
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: `testuser2_${timestamp}`,
          email: `test2_${timestamp}@example.com`,
          password: 'password123',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `test2_${timestamp}@example.com`,
          password: 'password123',
        });

      const otherUserToken = loginResponse.body.accessToken;

      const response = await request(app.getHttpServer())
        .patch(`/media/${fileId}/status`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          status: 'processing',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You do not have permission to update this file');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/media/${fileId}/status`)
        .send({
          status: 'processing',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /media - with status fields', () => {
    beforeEach(async () => {
      // Register and login a user
      const timestamp = Date.now();
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: `testuser_${timestamp}`,
          email: `test_${timestamp}@example.com`,
          password: 'password123',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `test_${timestamp}@example.com`,
          password: 'password123',
        });

      authToken = loginResponse.body.accessToken;
    });

    it('should include status and progress fields in file list', async () => {
      // Upload a file
      const uploadResponse = await request(app.getHttpServer())
        .post('/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake audio content'), {
          filename: 'test.mp3',
          contentType: 'audio/mpeg',
        });

      fileId = uploadResponse.body.file.id;

      // Update status
      await request(app.getHttpServer())
        .patch(`/media/${fileId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'processing',
          progress: 60,
        });

      // Get files
      const response = await request(app.getHttpServer())
        .get('/media')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0]).toMatchObject({
        id: fileId,
        status: 'processing',
        progress: 60,
      });
    });
  });
});
