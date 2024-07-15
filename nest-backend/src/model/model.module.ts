import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelSchema } from './entities/model.schema';
import { ModelService } from './model.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Model', schema: ModelSchema }]),
  ],
  providers: [ModelService],
})
export class ModelModule {}

