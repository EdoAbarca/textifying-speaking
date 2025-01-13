import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  Model as ModelDocument, 
  ModelDocument as ModelDocumentType } from './entities/model.schema';


@Injectable()
export class ModelService implements OnModuleInit {
  private readonly defaultModels = [
    { name: 'openai/whisper-large-v3', purpose: 'Transcript' },
    { name: 'csebuetnlp/mT5_multilingual_XLSum', purpose: 'Summarize' },
  ];

  constructor(@InjectModel(ModelDocument.name) private readonly modelModel: Model<ModelDocumentType>) {}

  async onModuleInit() {
    await this.verifyAndInsertDefaultData();
  }

  private async verifyAndInsertDefaultData() {
    for (const defaultModel of this.defaultModels) {
      const modelExists = await this.modelModel.findOne({ name: defaultModel.name }).exec();
      if (!modelExists) {
        const newModel = new this.modelModel(defaultModel);
        await newModel.save();
      }
    }
  }

  async create(createModelDto: ModelDocument): Promise<ModelDocument> {
    const createdModel = new this.modelModel(createModelDto);
    return createdModel.save();
  }

  findAll(): Promise<ModelDocument[]> {
    return this.modelModel.find().exec();
  }

  findOne(id: string): Promise<ModelDocument> {
    return this.modelModel.findById(id).exec();
  }

  async update(id: string, updateModelDto: ModelDocument): Promise<ModelDocument> {
    return this.modelModel.findByIdAndUpdate(id, updateModelDto, { new: true }).exec();
  }

  async remove(id: string): Promise<ModelDocument> {
    return this.modelModel.findByIdAndDelete(id).exec();
  }
}