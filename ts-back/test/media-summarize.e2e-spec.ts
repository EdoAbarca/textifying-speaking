import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { Model, Types } from 'mongoose';
import { MediaModule } from '../src/media/media.module';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { MediaFile, MediaFileDocument } from '../src/media/schemas/media-file.schema';
import { User, UserDocument } from '../src/users/schemas/user.schema';

describe('Media Summarization (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<UserDocument>;
  let mediaFileModel: Model<MediaFileDocument>;
  let authToken: string;
  let userId: string;
  let fileId: string;
  let otherUserId: string;
  let otherUserToken: string;

  const uniqueTimestamp = Date.now();
  const testUser = {
    username: `summarizetest_${uniqueTimestamp}`,
    email: `summarizetest_${uniqueTimestamp}@example.com`,
    password: 'password123',
  };

  const otherUser = {
    username: `summarizetest_other_${uniqueTimestamp}`,
    email: `summarizetest_other_${uniqueTimestamp}@example.com`,
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/textifying-speaking'),
        BullModule.forRoot({
          connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
          },
        }),
        JwtModule.register({
          secret: process.env.JWT_SECRET || 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        AuthModule,
        UsersModule,
        MediaModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
    mediaFileModel = moduleFixture.get<Model<MediaFileDocument>>(getModelToken(MediaFile.name));

    // Register test user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    expect(registerResponse.status).toBe(201);

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;

    // Register and login other user
    const registerOtherResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(otherUser);

    expect(registerOtherResponse.status).toBe(201);

    const loginOtherResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: otherUser.email,
        password: otherUser.password,
      });

    expect(loginOtherResponse.status).toBe(200);
    otherUserToken = loginOtherResponse.body.accessToken;
    otherUserId = loginOtherResponse.body.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await userModel.deleteMany({
      email: {
        $in: [testUser.email, otherUser.email],
      },
    });

    await mediaFileModel.deleteMany({
      userId: {
        $in: [new Types.ObjectId(userId), new Types.ObjectId(otherUserId)],
      },
    });

    await app.close();
  });

  beforeEach(async () => {
    // Create a test file with completed transcription
    const testFile = new mediaFileModel({
      userId: new Types.ObjectId(userId),
      filename: `test-${Date.now()}.mp3`,
      originalFilename: 'test.mp3',
      mimetype: 'audio/mpeg',
      path: '/uploads/test.mp3',
      size: 1024,
      status: 'completed',
      progress: 100,
      transcribedText: 'This is a transcribed text that needs to be summarized for testing purposes.',
    });

    const savedFile = await testFile.save();
    fileId = savedFile._id.toString();
  });

  afterEach(async () => {
    // Clean up test file
    if (fileId) {
      await mediaFileModel.findByIdAndDelete(fileId);
    }
  });

  describe('POST /media/:id/summarize', () => {
    it('should start summarization for completed file', async () => {
      const response = await request(app.getHttpServer())
        .post(`/media/${fileId}/summarize`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Summarization started');
      expect(response.body).toHaveProperty('file');
      expect(response.body.file).toHaveProperty('id', fileId);
      expect(response.body.file).toHaveProperty('summaryStatus', 'processing');

      // Verify file was updated in database
      const file = await mediaFileModel.findById(fileId);
      expect(file?.summaryStatus).toBe('processing');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/media/${fileId}/summarize`)
        .expect(401);
    });

    it('should return 403 for file owned by another user', async () => {
      await request(app.getHttpServer())
        .post(`/media/${fileId}/summarize`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent file', async () => {
      const fakeId = new Types.ObjectId().toString();

      await request(app.getHttpServer())
        .post(`/media/${fakeId}/summarize`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should reject file without completed transcription', async () => {
      // Create file with 'ready' status
      const readyFile = new mediaFileModel({
        userId: new Types.ObjectId(userId),
        filename: `ready-${Date.now()}.mp3`,
        originalFilename: 'ready.mp3',
        mimetype: 'audio/mpeg',
        path: '/uploads/ready.mp3',
        size: 1024,
        status: 'ready',
        progress: 100,
      });

      const savedReadyFile = await readyFile.save();

      try {
        await request(app.getHttpServer())
          .post(`/media/${savedReadyFile._id}/summarize`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);
      } finally {
        await mediaFileModel.findByIdAndDelete(savedReadyFile._id);
      }
    });

    it('should reject file without transcribed text', async () => {
      // Create file with 'completed' status but no transcribedText
      const noTextFile = new mediaFileModel({
        userId: new Types.ObjectId(userId),
        filename: `notext-${Date.now()}.mp3`,
        originalFilename: 'notext.mp3',
        mimetype: 'audio/mpeg',
        path: '/uploads/notext.mp3',
        size: 1024,
        status: 'completed',
        progress: 100,
      });

      const savedNoTextFile = await noTextFile.save();

      try {
        await request(app.getHttpServer())
          .post(`/media/${savedNoTextFile._id}/summarize`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);
      } finally {
        await mediaFileModel.findByIdAndDelete(savedNoTextFile._id);
      }
    });

    it('should reject if already summarizing', async () => {
      // Update file to processing status
      await mediaFileModel.findByIdAndUpdate(fileId, {
        summaryStatus: 'processing',
      });

      await request(app.getHttpServer())
        .post(`/media/${fileId}/summarize`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
