import { Injectable } from '@nestjs/common';
import { CreateTranscriptionDto } from './dto/create-transcription.dto';
import { UpdateTranscriptionDto } from './dto/update-transcription.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Transcription } from './entities/transcription.schema';
import { Model } from 'mongoose';

@Injectable()
export class TranscriptionService {
  constructor(@InjectModel('Transcription') private transcriptionModel: Model<Transcription>) {}

  async create(createTranscriptionDto: CreateTranscriptionDto): Promise<Transcription> {
    const createdTranscription = new this.transcriptionModel(createTranscriptionDto);
    return createdTranscription.save();
  }

  findAll(): Promise<Transcription[]> {
    return this.transcriptionModel.find().exec();
  }

  findOne(id: string): Promise<Transcription> {
    return this.transcriptionModel.findById(id).exec();
  }

  async update(id: string, updateTranscriptionDto: UpdateTranscriptionDto): Promise<Transcription> {
    return this.transcriptionModel.findByIdAndUpdate(id, updateTranscriptionDto, {new: true}).exec();
  }

  async remove(id: string): Promise<Transcription> {
    return this.transcriptionModel.findByIdAndDelete(id).exec();
  }
}
