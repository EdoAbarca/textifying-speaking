import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MethodsService } from './methods.service';
import { CreateMethodDto } from './dto/create-method.dto';
import { UpdateMethodDto } from './dto/update-method.dto';

@Controller('methods')
export class MethodsController {
  constructor(private readonly methodsService: MethodsService) {}

  @Post()
  create(@Body() createMethodDto: CreateMethodDto) {
    return this.methodsService.create(createMethodDto);
  }

  @Get()
  findAll() {
    return this.methodsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.methodsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMethodDto: UpdateMethodDto) {
    return this.methodsService.update(+id, updateMethodDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.methodsService.remove(+id);
  }
}
