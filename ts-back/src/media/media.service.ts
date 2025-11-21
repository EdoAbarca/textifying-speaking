import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MediaFile, MediaFileDocument } from './schemas/media-file.schema';

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
      status: 'uploaded',
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
}
