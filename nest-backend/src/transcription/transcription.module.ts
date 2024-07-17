import { Module } from '@nestjs/common';
import { TranscriptionService } from './transcription.service';
import { TranscriptionController } from './transcription.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TranscriptionSchema } from './entities/transcription.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Transcription', schema: TranscriptionSchema }])
  ],
  controllers: [TranscriptionController],
  providers: [TranscriptionService]
})
export class TranscriptionModule {}
