import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


class ModelDto {
  @IsString()
  name: string;

  @IsString()
  goal: string;
}

export class CreateKeyDto {
  @IsString()
  api_key: string;

  @ValidateNested()
  @Type(() => ModelDto)
  model: ModelDto;
}
