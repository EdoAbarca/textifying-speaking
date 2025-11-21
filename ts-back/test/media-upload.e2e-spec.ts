import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { AppModule } from './../src/app.module';

describe('Media Upload (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  const uploadsDir = join(__dirname, '..', 'test-uploads');

  beforeAll(async () => {
    // Set environment variables for testing
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';
    process.env.MEDIA_STORAGE_PATH = uploadsDir;
    
    // Create test uploads directory
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    // Register a test user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'uploadtester',
        email: 'upload@test.com',
        password: 'password123',
      });

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'upload@test.com',
        password: 'password123',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test uploads
    if (existsSync(uploadsDir)) {
      const files = readdirSync(uploadsDir);
      files.forEach((file) => {
        unlinkSync(join(uploadsDir, file));
      });
    }

    await app.close();
  });

  describe('/media/upload (POST)', () => {
    it('should upload a valid MP3 file', () => {
      return request(app.getHttpServer())
        .post('/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake mp3 content'), {
          filename: 'test.mp3',
          contentType: 'audio/mpeg',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('File uploaded successfully');
          expect(res.body.file).toBeDefined();
          expect(res.body.file.originalFilename).toBe('test.mp3');
          expect(res.body.file.mimetype).toBe('audio/mpeg');
          expect(res.body.file.status).toBe('uploaded');
        });
    });

    it('should upload a valid WAV file', () => {
      return request(app.getHttpServer())
        .post('/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake wav content'), {
          filename: 'test.wav',
          contentType: 'audio/wav',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('File uploaded successfully');
          expect(res.body.file.mimetype).toBe('audio/wav');
        });
    });

    it('should upload a valid MP4 file', () => {
      return request(app.getHttpServer())
        .post('/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake mp4 content'), {
          filename: 'test.mp4',
          contentType: 'video/mp4',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('File uploaded successfully');
          expect(res.body.file.mimetype).toBe('video/mp4');
        });
    });

    it('should upload a valid M4A file', () => {
      return request(app.getHttpServer())
        .post('/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake m4a content'), {
          filename: 'test.m4a',
          contentType: 'audio/mp4',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('File uploaded successfully');
          expect(res.body.file.mimetype).toBe('audio/mp4');
        });
    });

    it('should reject upload without authentication', () => {
      return request(app.getHttpServer())
        .post('/media/upload')
        .attach('file', Buffer.from('fake content'), {
          filename: 'test.mp3',
          contentType: 'audio/mpeg',
        })
        .expect(401);
    });

    it('should reject upload with invalid file type', () => {
      return request(app.getHttpServer())
        .post('/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake pdf content'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);
    });

    it('should reject upload without file', () => {
      return request(app.getHttpServer())
        .post('/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('No file uploaded');
        });
    });

    it('should reject upload with invalid token', () => {
      return request(app.getHttpServer())
        .post('/media/upload')
        .set('Authorization', 'Bearer invalid-token')
        .attach('file', Buffer.from('fake content'), {
          filename: 'test.mp3',
          contentType: 'audio/mpeg',
        })
        .expect(401);
    });
  });
});
