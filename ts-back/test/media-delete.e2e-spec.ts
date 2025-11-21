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

describe('DELETE /media/:id (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let mediaFileModel: Model<MediaFile>;
  let accessToken: string;
  let userId: string;
  let otherUserId: string;
  let otherAccessToken: string;
  const testUploadsDir = path.join(__dirname, '..', 'test-uploads');

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

    // Ensure test uploads directory exists
    try {
      await fs.mkdir(testUploadsDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
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

  describe('DELETE /media/:id', () => {
    it('should delete a file successfully', async () => {
      // Create a test file
      const testFilePath = path.join(testUploadsDir, 'test-delete-file.mp3');
      await fs.writeFile(testFilePath, 'test content');

      const file = new mediaFileModel({
        userId,
        filename: 'test-delete-file.mp3',
        originalFilename: 'test.mp3',
        mimetype: 'audio/mpeg',
        path: testFilePath,
        size: 1024,
        uploadDate: new Date(),
        status: 'uploaded',
      });
      const savedFile = await file.save();

      // Delete the file
      const response = await request(app.getHttpServer())
        .delete(`/media/${savedFile._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('File deleted successfully');

      // Verify file is deleted from database
      const deletedFile = await mediaFileModel.findById(savedFile._id);
      expect(deletedFile).toBeNull();

      // Verify physical file is deleted
      try {
        await fs.access(testFilePath);
        fail('File should have been deleted');
      } catch (error) {
        expect(error.code).toBe('ENOENT');
      }
    });

    it('should return 404 if file does not exist', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      return request(app.getHttpServer())
        .delete(`/media/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe('File not found');
        });
    });

    it('should return 403 if user tries to delete another user\'s file', async () => {
      // Create a file for the first user
      const testFilePath = path.join(testUploadsDir, 'test-forbidden-file.mp3');
      await fs.writeFile(testFilePath, 'test content');

      const file = new mediaFileModel({
        userId,
        filename: 'test-forbidden-file.mp3',
        originalFilename: 'test.mp3',
        mimetype: 'audio/mpeg',
        path: testFilePath,
        size: 1024,
        uploadDate: new Date(),
        status: 'uploaded',
      });
      const savedFile = await file.save();

      // Try to delete with second user's token
      return request(app.getHttpServer())
        .delete(`/media/${savedFile._id}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toBe('You do not have permission to delete this file');
        });
    });

    it('should return 401 if no token provided', async () => {
      const file = new mediaFileModel({
        userId,
        filename: 'test-unauth-file.mp3',
        originalFilename: 'test.mp3',
        mimetype: 'audio/mpeg',
        path: '/uploads/test-unauth-file.mp3',
        size: 1024,
        uploadDate: new Date(),
        status: 'uploaded',
      });
      const savedFile = await file.save();

      return request(app.getHttpServer())
        .delete(`/media/${savedFile._id}`)
        .expect(401);
    });

    it('should return 401 if invalid token provided', async () => {
      const file = new mediaFileModel({
        userId,
        filename: 'test-invalid-token-file.mp3',
        originalFilename: 'test.mp3',
        mimetype: 'audio/mpeg',
        path: '/uploads/test-invalid-token-file.mp3',
        size: 1024,
        uploadDate: new Date(),
        status: 'uploaded',
      });
      const savedFile = await file.save();

      return request(app.getHttpServer())
        .delete(`/media/${savedFile._id}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should delete from database even if physical file does not exist', async () => {
      // Create a file record without physical file
      const file = new mediaFileModel({
        userId,
        filename: 'test-missing-physical-file.mp3',
        originalFilename: 'test.mp3',
        mimetype: 'audio/mpeg',
        path: path.join(testUploadsDir, 'nonexistent-file.mp3'),
        size: 1024,
        uploadDate: new Date(),
        status: 'uploaded',
      });
      const savedFile = await file.save();

      // Delete the file
      const response = await request(app.getHttpServer())
        .delete(`/media/${savedFile._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('File deleted successfully');

      // Verify file is deleted from database
      const deletedFile = await mediaFileModel.findById(savedFile._id);
      expect(deletedFile).toBeNull();
    });
  });
});
