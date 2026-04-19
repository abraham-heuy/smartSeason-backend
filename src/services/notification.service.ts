import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Notification } from '../entities/Notification.entity';
import { CreateNotificationDto } from '../dtos/notification.dto';

export class NotificationService {
  private notificationRepository: Repository<Notification>;

  constructor() {
    this.notificationRepository = AppDataSource.getRepository(Notification);
  }

  async createNotification(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: createDto.userId,
      type: createDto.type,
      message: createDto.message,
      isRead: false,
    });
    return this.notificationRepository.save(notification);
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationRepository.update(notificationId, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.notificationRepository.delete(notificationId);
  }
}