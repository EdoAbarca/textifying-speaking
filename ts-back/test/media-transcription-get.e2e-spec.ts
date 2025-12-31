import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('MediaController - GET /media/:id/transcription (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let authToken: string;
  let secondUserToken: string;
  let fileId: string;
  let secondUserFileId: string;

  const uniqueTimestamp = Date.now();
  const testUser = {
    username: `tuser${uniqueTimestamp}`,
    email: `tuser${uniqueTimestamp}@test.com`,
    password: 'password123',
  };

  const secondUser = {
    username: `suser${uniqueTimestamp}`,
    email: `suser${uniqueTimestamp}@test.com`,
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());

    // Clean up any existing users with these emails
    await connection.collection('users').deleteMany({
      email: { $in: [testUser.email, secondUser.email] },
    });

    // Register and login test user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    authToken = loginResponse.body.accessToken;

    // Register and login second user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(secondUser)
      .expect(201);

    const secondLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: secondUser.email,
        password: secondUser.password,
      })
      .expect(200);

    secondUserToken = secondLoginResponse.body.accessToken;

    // Upload a test file for the first user
    const uploadResponse = await request(app.getHttpServer())
      .post('/media/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', Buffer.from('test audio content'), 'test.mp3')
      .expect(201);

    fileId = uploadResponse.body.file.id;

    // Upload a test file for the second user
    const secondUploadResponse = await request(app.getHttpServer())
      .post('/media/upload')
      .set('Authorization', `Bearer ${secondUserToken}`)
      .attach('file', Buffer.from('test audio content 2'), 'test2.mp3')
      .expect(201);

    secondUserFileId = secondUploadResponse.body.file.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (connection) {
      await connection.collection('users').deleteMany({
        email: { $in: [testUser.email, secondUser.email] },
      });
      await connection.collection('mediafiles').deleteMany({
        _id: { $in: [fileId, secondUserFileId].filter(Boolean).map(id => new Types.ObjectId(id)) },
      });
    }
    await app.close();
  });

  describe('GET /media/:id/transcription', () => {
    it('should return message for file in ready status', () => {
      return request(app.getHttpServer())
        .get(`/media/${fileId}/transcription`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ready');
          expect(res.body).toHaveProperty('message', 'Transcription has not been started yet');
          expect(res.body).not.toHaveProperty('transcription');
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get(`/media/${fileId}/transcription`)
        .expect(401);
    });

    it('should return 403 for file owned by another user', () => {
      return request(app.getHttpServer())
        .get(`/media/${secondUserFileId}/transcription`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toBe('You do not have permission to view this transcription');
        });
    });

    it('should return 404 for non-existent file', () => {
      const fakeId = '507f1f77bcf86cd799439011';
      return request(app.getHttpServer())
        .get(`/media/${fakeId}/transcription`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe('File not found');
        });
    });

    it('should return processing status when file is being processed', async () => {
      // Update file status to processing
      await request(app.getHttpServer())
        .patch(`/media/${fileId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'processing', progress: 50 })
        .expect(200);

      return request(app.getHttpServer())
        .get(`/media/${fileId}/transcription`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'processing');
          expect(res.body).toHaveProperty('progress', 50);
          expect(res.body).toHaveProperty('message', 'Transcription is in progress');
          expect(res.body).not.toHaveProperty('transcription');
        });
    });

    it('should return error status when transcription failed', async () => {
      const errorMessage = 'Test error: transcription service unavailable';
      
      // Update file status to error
      await request(app.getHttpServer())
        .patch(`/media/${fileId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'error', errorMessage })
        .expect(200);

      return request(app.getHttpServer())
        .get(`/media/${fileId}/transcription`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'error');
          expect(res.body).toHaveProperty('message', errorMessage);
          expect(res.body).not.toHaveProperty('transcription');
        });
    });

    it('should return transcription for completed file', async () => {
      const transcribedText = 'This is a test transcription';
      
      // Manually update the file in database to have completed status with transcription
      await connection.collection('mediafiles').updateOne(
        { _id: new Types.ObjectId(fileId) },
        { 
          $set: { 
            status: 'completed', 
            progress: 100,
            transcribedText 
          } 
        }
      );

      return request(app.getHttpServer())
        .get(`/media/${fileId}/transcription`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'completed');
          expect(res.body).toHaveProperty('transcription', transcribedText);
          expect(res.body).toHaveProperty('fileId', fileId);
          expect(res.body).toHaveProperty('originalFilename');
        });
    });

    it('should return 500 if completed file has no transcribed text', async () => {
      // Manually update file to have completed status without transcription
      await connection.collection('mediafiles').updateOne(
        { _id: new Types.ObjectId(fileId) },
        { 
          $set: { 
            status: 'completed', 
            progress: 100 
          },
          $unset: {
            transcribedText: ''
          }
        }
      );

      return request(app.getHttpServer())
        .get(`/media/${fileId}/transcription`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500)
        .expect((res) => {
          expect(res.body.message).toContain('Transcription text not available');
        });
    });
  });
});
