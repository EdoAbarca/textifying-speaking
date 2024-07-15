import { Module } from '@nestjs/common';
import { ModelService } from './model.service';
import { ModelController } from './model.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelSchema } from './entities/model.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Model', schema: ModelSchema }])
  ],
  controllers: [ModelController],
  providers: [ModelService],
})
export class ModelModule {}

