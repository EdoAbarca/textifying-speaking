// file-conversion.controller.ts
import { Controller, Post, UseInterceptors, UploadedFiles, HttpStatus, HttpException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { FileConversionService } from './file.service';
import {FileConversionResult} from './dto/types';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('api')
@ApiTags('file-conversion')
export class FileConversionController {
  constructor(private readonly fileConversionService: FileConversionService) {}

  @Post('convert-files')
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.OK, description: 'Files converted successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file format' })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('video/')) {
          return callback(
            new HttpException('Only video files are allowed', HttpStatus.BAD_REQUEST),
            false
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 10 // Maximum 10 files at once
      }
    })
  )
  async convertVideoToAudio(
    @UploadedFiles() files: { files: Express.Multer.File[] }
  ): Promise<FileConversionResult[]> {
    try {
      if (!files?.files?.length) {
        throw new HttpException('No files provided', HttpStatus.BAD_REQUEST);
      }

      return await this.fileConversionService.convertVideoToAudio(files.files);
    } catch (error) {
      throw new HttpException(
        error.message || 'File conversion failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}