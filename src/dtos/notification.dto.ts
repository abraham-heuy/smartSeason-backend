import { IsUUID, IsString, IsEnum, IsBoolean, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';
import { NotificationType } from '../entities/Notification.entity';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  message: string;
}

export class SendNotificationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  userIds: string[];

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;
}

export class UpdateNotificationDto {
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}