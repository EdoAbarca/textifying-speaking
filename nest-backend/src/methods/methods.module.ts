import { Module } from '@nestjs/common';
import { MethodsService } from './methods.service';
import { MethodsController } from './methods.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Transcription, TranscriptionSchema } from '../transcription/entities/transcription.schema';
import { Model, ModelSchema } from '../model/entities/model.schema';
import { Key, KeySchema } from '../key/entities/key.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transcription.name, schema: TranscriptionSchema },
      { name: Model.name, schema: ModelSchema },
      { name: Key.name, schema: KeySchema }]),
  ],
  controllers: [MethodsController],
  providers: [MethodsService]
})
export class MethodsModule {}
