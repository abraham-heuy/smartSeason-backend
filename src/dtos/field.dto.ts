import { CropType } from '../entities/croptype.enum';
import { FieldStage } from '../entities/FieldStage.enum';
import { IsEnum, IsString, IsDateString, IsOptional, IsUUID, MinLength } from 'class-validator';

export class CreateFieldDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEnum(CropType)
  cropType: CropType;

  @IsDateString()
  plantingDate: string; // YYYY-MM-DD

  @IsEnum(FieldStage)
  @IsOptional()
  currentStage?: FieldStage; // default Planted in service
}

export class UpdateFieldDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(CropType)
  @IsOptional()
  cropType?: CropType;

  @IsDateString()
  @IsOptional()
  plantingDate?: string;
}

export class AssignFieldDto {
  @IsUUID()
  agentId: string;
}