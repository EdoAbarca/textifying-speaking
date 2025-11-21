import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UseFilters,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from './media.service';
import { MulterExceptionFilter } from './filters/multer-exception.filter';

@Controller('media')
@UseFilters(MulterExceptionFilter)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const mediaFile = await this.mediaService.createMediaFile(
      req.user.sub,
      file,
    );

    return {
      message: 'File uploaded successfully',
      file: {
        id: mediaFile._id,
        filename: mediaFile.filename,
        originalFilename: mediaFile.originalFilename,
        mimetype: mediaFile.mimetype,
        size: mediaFile.size,
        uploadDate: mediaFile.uploadDate,
        status: mediaFile.status,
      },
    };
  }
}
