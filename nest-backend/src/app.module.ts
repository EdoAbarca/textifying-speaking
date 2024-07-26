import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiModule } from './api/api.module';
import { UserModule } from './user/user.module';
import { ModelModule } from './model/model.module';
import { KeyModule } from './key/key.module';
import { TranscriptionModule } from './transcription/transcription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    ApiModule,
    UserModule,
    ModelModule,
    KeyModule,
    TranscriptionModule,
  ],
})
export class AppModule {}
