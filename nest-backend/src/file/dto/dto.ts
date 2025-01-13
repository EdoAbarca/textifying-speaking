
import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';


export class FileConversionDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    files: Express.Multer.File[];
  }