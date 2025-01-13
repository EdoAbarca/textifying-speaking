// file-conversion.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileConversionResult } from './dto/types';

@Injectable()
export class FileConversionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FileConversionService.name);
  private readonly tempDir: string;
  private readonly outputDir: string;

  constructor(private readonly configService: ConfigService) {
    this.tempDir = this.configService.get<string>('TEMP_UPLOAD_DIR', './uploads/temp');
    this.outputDir = this.configService.get<string>('AUDIO_OUTPUT_DIR', './uploads/audio');
  }

  async onModuleInit() {
    // Ensure directories exist
    await fs.mkdir(this.tempDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async onModuleDestroy() {
    // Cleanup temp files older than 1 hour
    try {
      const files = await fs.readdir(this.tempDir);
      const oneHourAgo = Date.now() - 3600000;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);

        if (stats.ctimeMs < oneHourAgo) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }

  async convertVideoToAudio(files: Express.Multer.File[]): Promise<FileConversionResult[]> {
    const results: FileConversionResult[] = [];
    const errors: Error[] = [];

    await Promise.all(
      files.map(async (file) => {
        try {
          const result = await this.convertToAudio(file);
          results.push(result);
        } catch (error) {
          errors.push(new Error(`Failed to convert ${file.originalname}: ${error.message}`));
        }
      })
    );

    if (errors.length > 0) {
      this.logger.error('Conversion errors:', errors);
      if (errors.length === files.length) {
        throw new Error('All file conversions failed');
      }
    }

    return results;
  }

  private async convertToAudio(videoFile: Express.Multer.File): Promise<FileConversionResult> {
    const outputFileName = `${path.parse(videoFile.filename).name}.mp3`;
    const outputPath = path.join(this.outputDir, outputFileName);

    try {
      const metadata = await this.getVideoMetadata(videoFile.path);
      
      await this.runFfmpeg(videoFile.path, outputPath);
      
      const stats = await fs.stat(outputPath);

      return {
        audioFilePath: outputPath,
        originalName: videoFile.originalname,
        duration: metadata.duration,
        size: stats.size
      };
    } catch (error) {
      await this.cleanup(videoFile.path, outputPath);
      throw error;
    }
  }

  private getVideoMetadata(filePath: string): Promise<{ duration: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        resolve({
          duration: metadata.format.duration
        });
      });
    });
  }

  private runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  }

  private async cleanup(...filePaths: string[]) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        this.logger.warn(`Failed to cleanup file ${filePath}:`, error);
      }
    }
  }
}