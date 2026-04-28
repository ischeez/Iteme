import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class SubmitVerificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  details: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsUrl({}, { each: true })
  evidenceImages?: string[];
}
