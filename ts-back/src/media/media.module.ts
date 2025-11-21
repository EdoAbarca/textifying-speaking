import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaGateway } from './media.gateway';
import { MediaFile, MediaFileSchema } from './schemas/media-file.schema';

const ALLOWED_MIMETYPES = [
  'audio/mpeg', // .mp3
  'audio/wav', // .wav
  'audio/x-wav', // .wav
  'video/mp4', // .mp4
  'audio/mp4', // .m4a
  'audio/x-m4a', // .m4a
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MediaFile.name, schema: MediaFileSchema },
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: process.env.MEDIA_STORAGE_PATH || './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
          return callback(
            new Error(
              'Invalid file type. Only .mp3, .wav, .mp4, and .m4a files are allowed',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, MediaGateway],
  exports: [MediaService],
})
export class MediaModule {}
