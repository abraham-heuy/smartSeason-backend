import { FieldStage } from '../entities/FieldStage.enum';
import { IsEnum, IsString, IsOptional } from 'class-validator';

export class CreateFieldUpdateDto {
  @IsEnum(FieldStage)
  stage: FieldStage;

  @IsString()
  @IsOptional()
  notes?: string;
}