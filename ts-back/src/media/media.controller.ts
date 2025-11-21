import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
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

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getFiles(@Request() req) {
    const files = await this.mediaService.findAllByUserId(req.user.sub);

    return {
      files: files.map((file) => ({
        id: file._id,
        filename: file.filename,
        originalFilename: file.originalFilename,
        mimetype: file.mimetype,
        size: file.size,
        uploadDate: file.uploadDate,
        status: file.status,
      })),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async deleteFile(@Param('id') id: string, @Request() req) {
    const file = await this.mediaService.findById(id);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Verify file ownership
    if (file.userId.toString() !== req.user.sub) {
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    await this.mediaService.deleteFileById(id);

    return {
      message: 'File deleted successfully',
    };
  }
}
