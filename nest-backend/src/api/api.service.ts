import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transcription } from '../transcription/entities/transcription.schema';
import { Model as ModelDocument, ModelDocument as ModelDocumentType } from '../model/entities/model.schema';
import { Key } from '../key/entities/key.schema';
import ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class ApiService {
	constructor(
		@InjectModel(Transcription.name) private TranscriptionModel: Model<Transcription>,
		@InjectModel(ModelDocument.name) private modelDocument: Model<ModelDocumentType>,
		@InjectModel(Key.name) private keyModel: Model<Key>,
	) { }

	getTranscriptorModels(): Promise<ModelDocumentType[]> {
		return this.modelDocument.find({ purpose: "Transcript" }).exec();
	}

	getSummarizerModels(): Promise<ModelDocumentType[]> {
		return this.modelDocument.find({ purpose: "Summarize" }).exec();
	}

	getModels(): Promise<ModelDocumentType[]> {
		return this.modelDocument.find().exec();
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
		return this.keyModel.find({ purpose: "Transcript" }).exec(); //Revisar
	}

	getSummarizersAPIKeys(): Promise<Key[]> {
		return this.keyModel.find({ purpose: "Summarize" }).exec(); //Revisar
	}

	async createKey(createKeyDto: Key): Promise<Key> {
		const createdKey = new this.keyModel(createKeyDto);
		return createdKey.save();
	}

	async convertVideoToAudio(files: Express.Multer.File[]): Promise<{ audioFilePath: string }[]> {
		const audioFiles: { audioFilePath: string }[] = [];

		// Convert video files to audio
		for (const file of files) {
			if (file.mimetype.startsWith('video/')) {
				try {
					const audioFilePath = await this.convertToAudio(file);
					audioFiles.push({ audioFilePath });
				} catch (error) {
					console.error(`Error converting file ${file.originalname}: `, error);
					throw new Error(`Failed to convert ${file.originalname}`);
				}
			}
		}

		return audioFiles;
	}

	private async convertToAudio(videoFile: Express.Multer.File): Promise<string> {
		return new Promise((resolve, reject) => {
			const audioFilePath = `path/to/audio/${videoFile.filename}.mp3`; // Define your audio file path
			ffmpeg(videoFile.path)
				.output(audioFilePath)
				.on('end', () => resolve(audioFilePath))
				.on('error', (err) => reject(err))
				.run();
		});
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
