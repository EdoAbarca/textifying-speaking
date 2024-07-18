import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transcription } from '../transcription/entities/transcription.schema';
import { Model as ModelDocument, ModelDocument as ModelDocumentType } from '../model/entities/model.schema';
import { Key } from '../key/entities/key.schema';

@Injectable()
export class MethodsService {
    constructor(
        @InjectModel(Transcription.name) private TranscriptionModel: Model<Transcription>,
        @InjectModel(ModelDocument.name) private modelDocument: Model<ModelDocumentType>,
        @InjectModel(Key.name) private keyModel: Model<Key>,
    ) {}

    getTranscriptorModels(): Promise<ModelDocumentType[]> {
        return this.modelDocument.find({ goal: "Transcript" }).exec();
    }

    getSummarizerModels(): Promise<ModelDocumentType[]> {
        return this.modelDocument.find({ goal: "Summarize" }).exec();
    }

    getTranscriptions(): Promise<Transcription[]> {
        return this.TranscriptionModel.find().exec();
    }

    /*
    getAPIKeys(): Promise<Key[]> {
        return this.keyModel.find().exec();
    }
    */

    getTranscriptorsAPIKeys(): Promise<Key[]> {
        return this.keyModel.find({ goal: "Transcript" }).exec(); //Revisar
    }

    getSummarizersAPIKeys(): Promise<Key[]> {
        return this.keyModel.find({ goal: "Summarize" }).exec(); //Revisar
    }

    async createKey(createKeyDto: Key): Promise<Key> {
        const createdKey = new this.keyModel(createKeyDto);
        return createdKey.save();
    }

    async createTranscription(createTranscriptionDto: Transcription): Promise<Transcription> {
        const createdTranscription = new this.TranscriptionModel(createTranscriptionDto);
        return createdTranscription.save();
    }

    async removeTranscription(id: string): Promise<Transcription> {
        return this.TranscriptionModel.findByIdAndDelete(id).exec();
    }

    async removeKey(id: string): Promise<Key> {
        return this.keyModel.findByIdAndDelete(id).exec();
    }
}
