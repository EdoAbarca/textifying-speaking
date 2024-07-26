import { Summary } from '../entities/transcription.schema';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ModelDto {
	@IsString()
	name: string;

	@IsString()
	purpose: string;

	@IsString()
	service: string;
}

export class CreateTranscriptionDto {
	@IsString()
	file_name: string;

	@IsString()
	transcription: string;

	@IsNumber()
	word_count: number;

	@ValidateNested()
	@Type(() => ModelDto)
	model: ModelDto;

	@ValidateNested({ each: true })
	@Type(() => Summary)
	summaries: Summary[];
}
