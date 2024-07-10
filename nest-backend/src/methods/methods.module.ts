import { Module } from '@nestjs/common';
import { MethodsService } from './methods.service';
import { MethodsController } from './methods.controller';

@Module({
  controllers: [MethodsController],
  providers: [MethodsService]
})
export class MethodsModule {}
