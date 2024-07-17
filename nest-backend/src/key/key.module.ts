import { Module } from '@nestjs/common';
import { KeyService } from './key.service';
import { KeyController } from './key.controller';
import { KeySchema } from './entities/key.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({imports: [
  MongooseModule.forFeature([{ name: 'Key', schema: KeySchema }])
],
  controllers: [KeyController],
  providers: [KeyService]
})
export class KeyModule {}
