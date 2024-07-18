import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MethodsService } from './methods.service';
import { CreateTranscriptionDto } from 'src/transcription/dto/create-transcription.dto';
import { CreateKeyDto } from 'src/key/dto/create-key.dto';


@Controller('methods')
export class MethodsController {
  constructor(private readonly methodsService: MethodsService) {}

  @Get('transcriptor-models')
  getTranscriptorModels() {
    return this.methodsService.getTranscriptorModels();
  }

  @Get('summarizer-models')
  getSummarizerModels() {
    return this.methodsService.getSummarizerModels
  }

  @Get('transcriptions')
  getTranscriptions() {
    return this.methodsService.getTranscriptions();
  }

  @Get('transcriptor-keys')
  getTranscriptorKeys() {
    return this.methodsService.getTranscriptorsAPIKeys();
  }

  @Get('summarizer-keys')
  getSummarizerKeys() {
    return this.methodsService.getSummarizersAPIKeys();
  }

  @Post('create-key')
  createKey(@Body() createKeyDto: CreateKeyDto) {
    return this.methodsService.createKey(createKeyDto);
  }

  @Post('create-transcription')
  createTranscription(@Body() createTranscriptionDto: CreateTranscriptionDto) {
    return this.methodsService.createTranscription(createTranscriptionDto);
  }

  @Delete('remove-transcription/:id')
  removeTranscription(@Param('id') id: string) {
    return this.methodsService.removeTranscription(id);
  }

  @Delete('remove-key/:id')
  removeKey(@Param('id') id: string) {
    return this.methodsService.removeKey(id);
  }
}
