import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiModule } from './api/api.module';
import { UserModule } from './user/user.module';
import { TranscriptionModule } from './transcription/transcription.module';
import { SummaryModule } from './summary/summary.module';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    ApiModule,
    UserModule,
    TranscriptionModule,
    SummaryModule,
    FileModule,
  ],
})
export class AppModule {}
