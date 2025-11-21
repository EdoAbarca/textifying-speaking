import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MediaFileDocument = MediaFile & Document;

@Schema({ timestamps: true })
export class MediaFile {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalFilename: string;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  size: number;

  @Prop({ default: Date.now })
  uploadDate: Date;

  @Prop({ 
    default: 'ready', 
    enum: ['uploading', 'ready', 'processing', 'completed', 'error'] 
  })
  status: string;

  @Prop({ default: 0, min: 0, max: 100 })
  progress: number;

  @Prop()
  errorMessage?: string;
}

export const MediaFileSchema = SchemaFactory.createForClass(MediaFile);
