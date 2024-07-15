import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ModelService } from './model.service';
import { Model as ModelDocument } from './entities/model.schema';

@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Post()
  create(@Body() createModelDto: ModelDocument) {
    return this.modelService.create(createModelDto);
  }

  @Get()
  findAll() {
    return this.modelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modelService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateModelDto: ModelDocument) {
    return this.modelService.update(id, updateModelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modelService.remove(id);
  }
}
