import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MediaFile, MediaFileDocument } from './schemas/media-file.schema';
import * as fs from 'fs/promises';
import axios from 'axios';
import FormData from 'form-data';
import * as fsSync from 'fs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediaService {
  private readonly transcriptionServiceUrl: string;

  constructor(
    @InjectModel(MediaFile.name)
    private mediaFileModel: Model<MediaFileDocument>,
    private configService: ConfigService,
  ) {
    this.transcriptionServiceUrl = this.configService.get<string>(
      'TRANSCRIPTION_SERVICE_URL',
      'http://ts-transcription:5000',
    );
  }

  async createMediaFile(
    userId: string,
    file: Express.Multer.File,
  ): Promise<MediaFileDocument> {
    const mediaFile = new this.mediaFileModel({
      userId,
      filename: file.filename,
      originalFilename: file.originalname,
      mimetype: file.mimetype,
      path: file.path,
      size: file.size,
      uploadDate: new Date(),
      status: 'ready',
      progress: 100,
    });

    return mediaFile.save();
  }

  async findAllByUserId(userId: string): Promise<MediaFileDocument[]> {
    return this.mediaFileModel.find({ userId }).exec();
  }

  async findById(id: string): Promise<MediaFileDocument | null> {
    return this.mediaFileModel.findById(id).exec();
  }

  async deleteById(id: string): Promise<void> {
    await this.mediaFileModel.findByIdAndDelete(id).exec();
  }

  async deleteFileById(id: string): Promise<void> {
    const file = await this.findById(id);
    
    if (!file) {
      throw new InternalServerErrorException('File not found in database');
    }

    // Delete physical file from storage
    try {
      await fs.unlink(file.path);
    } catch (error) {
      // Log error but continue to delete from database
      console.error(`Failed to delete physical file: ${file.path}`, error);
    }

    // Delete from database
    await this.deleteById(id);
  }

  async updateFileStatus(
    id: string,
    status: 'uploading' | 'ready' | 'processing' | 'completed' | 'error',
    progress?: number,
    errorMessage?: string,
  ): Promise<MediaFileDocument | null> {
    const updateData: any = { status };
    
    if (progress !== undefined) {
      updateData.progress = progress;
    }
    
    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }

    return this.mediaFileModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async updateFileProgress(
    id: string,
    progress: number,
  ): Promise<MediaFileDocument | null> {
    return this.mediaFileModel
      .findByIdAndUpdate(id, { progress }, { new: true })
      .exec();
  }

  async transcribeFile(id: string): Promise<MediaFileDocument> {
    const file = await this.findById(id);
    
    if (!file) {
      throw new InternalServerErrorException('File not found');
    }

    // Check if file is in a valid state for transcription
    if (file.status === 'processing') {
      throw new InternalServerErrorException('File is already being processed');
    }

    if (file.status === 'completed') {
      throw new InternalServerErrorException('File has already been transcribed');
    }

    // Update status to processing
    await this.updateFileStatus(id, 'processing', 0);

    try {
      // Prepare form data with the audio file
      const formData = new FormData();
      const fileStream = fsSync.createReadStream(file.path);
      formData.append('file', fileStream, file.originalFilename);

      // Call transcription service
      const response = await axios.post(
        `${this.transcriptionServiceUrl}/transcribe`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 300000, // 5 minutes timeout
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Transcription failed');
      }

      // Update file with transcribed text and completed status
      const updatedFile = await this.mediaFileModel
        .findByIdAndUpdate(
          id,
          {
            status: 'completed',
            progress: 100,
            transcribedText: response.data.text,
          },
          { new: true },
        )
        .exec();

      if (!updatedFile) {
        throw new InternalServerErrorException('Failed to update file');
      }

      return updatedFile;
    } catch (error) {
      // Update status to error
      const errorMessage = error.response?.data?.error || error.message || 'Transcription failed';
      
      await this.updateFileStatus(id, 'error', 0, errorMessage);

      throw new InternalServerErrorException(`Transcription failed: ${errorMessage}`);
    }
  }
}
