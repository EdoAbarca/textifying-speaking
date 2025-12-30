import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
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
import { MediaGateway } from './media.gateway';
import { MulterExceptionFilter } from './filters/multer-exception.filter';

@Controller('media')
@UseFilters(MulterExceptionFilter)
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly mediaGateway: MediaGateway,
  ) {}

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

    // Emit real-time update for file upload completion
    this.mediaGateway.emitFileStatusUpdate(req.user.sub, {
      id: mediaFile._id.toString(),
      filename: mediaFile.filename,
      originalFilename: mediaFile.originalFilename,
      mimetype: mediaFile.mimetype,
      size: mediaFile.size,
      uploadDate: mediaFile.uploadDate,
      status: mediaFile.status,
      progress: mediaFile.progress,
    });

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
        progress: mediaFile.progress,
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
        progress: file.progress,
        errorMessage: file.errorMessage,
        transcribedText: file.transcribedText,
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

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updateFileStatus(
    @Param('id') id: string,
    @Body() body: { status: string; progress?: number; errorMessage?: string },
    @Request() req,
  ) {
    const file = await this.mediaService.findById(id);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Verify file ownership
    if (file.userId.toString() !== req.user.sub) {
      throw new ForbiddenException('You do not have permission to update this file');
    }

    // Validate status
    const validStatuses = ['uploading', 'ready', 'processing', 'completed', 'error'];
    if (!validStatuses.includes(body.status)) {
      throw new BadRequestException('Invalid status value');
    }

    const updatedFile = await this.mediaService.updateFileStatus(
      id,
      body.status as any,
      body.progress,
      body.errorMessage,
    );

    if (!updatedFile) {
      throw new NotFoundException('File not found');
    }

    // Emit real-time update
    this.mediaGateway.emitFileStatusUpdate(req.user.sub, {
      id: updatedFile._id.toString(),
      filename: updatedFile.filename,
      originalFilename: updatedFile.originalFilename,
      mimetype: updatedFile.mimetype,
      size: updatedFile.size,
      uploadDate: updatedFile.uploadDate,
      status: updatedFile.status,
      progress: updatedFile.progress,
      errorMessage: updatedFile.errorMessage,
    });

    return {
      message: 'File status updated successfully',
      file: {
        id: updatedFile._id,
        status: updatedFile.status,
        progress: updatedFile.progress,
        errorMessage: updatedFile.errorMessage,
      },
    };
  }

  @Post(':id/transcribe')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async transcribeFile(@Param('id') id: string, @Request() req) {
    const file = await this.mediaService.findById(id);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Verify file ownership
    if (file.userId.toString() !== req.user.sub) {
      throw new ForbiddenException('You do not have permission to transcribe this file');
    }

    // Check if file is audio/video
    const validMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'audio/x-m4a'];
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File must be an audio or video file');
    }

    // Emit initial processing status
    this.mediaGateway.emitFileStatusUpdate(req.user.sub, {
      id: file._id.toString(),
      filename: file.filename,
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size,
      uploadDate: file.uploadDate,
      status: 'processing',
      progress: 0,
    });

    // Start transcription asynchronously
    this.mediaService.transcribeFile(id)
      .then((updatedFile) => {
        // Emit completion status
        this.mediaGateway.emitFileStatusUpdate(req.user.sub, {
          id: updatedFile._id.toString(),
          filename: updatedFile.filename,
          originalFilename: updatedFile.originalFilename,
          mimetype: updatedFile.mimetype,
          size: updatedFile.size,
          uploadDate: updatedFile.uploadDate,
          status: updatedFile.status,
          progress: updatedFile.progress,
          transcribedText: updatedFile.transcribedText,
        });
      })
      .catch((error) => {
        console.error(`Transcription failed for file ${id}:`, error);
        // Error status will be emitted by the service via updateFileStatus
      });

    return {
      message: 'Transcription started',
      file: {
        id: file._id,
        status: 'processing',
      },
    };
  }
}
