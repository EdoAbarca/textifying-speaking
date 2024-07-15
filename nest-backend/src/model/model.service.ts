// src/models/model.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Model as ModelDocument } from './entities/model.schema';

@Injectable()
export class ModelService implements OnModuleInit {
  private readonly defaultModels = [
    { name: 'openai/whisper-large-v3', goal: 'Transcript' },
    { name: 'csebuetnlp/mT5_multilingual_XLSum', goal: 'Summarize' },
  ];

  constructor(@InjectModel('Model') private readonly modelModel: Model<ModelDocument>) {}

  async onModuleInit() {
    await this.ensureDefaultModels();
  }

  private async ensureDefaultModels() {
    for (const defaultModel of this.defaultModels) {
      const exists = await this.modelModel.exists({ name: defaultModel.name });
      if (!exists) {
        await new this.modelModel(defaultModel).save();
      }
    }
  }
}
