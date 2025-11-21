import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MediaFile, MediaFileDocument } from './schemas/media-file.schema';
import * as fs from 'fs/promises';

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(MediaFile.name)
    private mediaFileModel: Model<MediaFileDocument>,
  ) {}

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
}
