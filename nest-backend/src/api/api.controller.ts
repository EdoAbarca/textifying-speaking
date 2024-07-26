import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, UploadedFiles, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiService } from './api.service';
import { CreateTranscriptionDto } from 'src/transcription/dto/create-transcription.dto';
import { CreateKeyDto } from 'src/key/dto/create-key.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';


@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('model')
  getModel() {
    return this.apiService.getModels();
  }

  @Get('transcription')
  getTranscriptions() {
    return this.apiService.getTranscriptions();
  }

  @Get('key/transcriptor')
  getTranscriptorKeys() {
    return this.apiService.getTranscriptorsAPIKeys();
  }

  @Get('key/summarizer')
  getSummarizerKeys() {
    return this.apiService.getSummarizersAPIKeys();
  }

  @Post('key')
  createKey(@Body() createKeyDto: CreateKeyDto) {
    return this.apiService.createKey(createKeyDto);
  }

  @Post('file')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files' }]))
  async convertVideoToAudio(@UploadedFiles() files: any) {
    return this.apiService.convertVideoToAudio(files);
  }

  @Post('transcription')
  createTranscription(@Body() createTranscriptionDto: CreateTranscriptionDto) {
    return this.apiService.createTranscription(createTranscriptionDto);
  }

  @Delete('transcription/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTranscription(@Param('id') id: string) {
    return this.apiService.removeTranscription(id);
  }

  @Delete('key/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeKey(@Param('id') id: string) {
    return this.apiService.removeKey(id);
  }
}
