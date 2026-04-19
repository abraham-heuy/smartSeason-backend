import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { SendNotificationDto, UpdateNotificationDto } from '../dtos/notification.dto';
import { validate } from 'class-validator';
import { RoleName } from '../entities/Role.entity';
import { BadRequestException } from '../exceptions/BadRequest.exception';
import { ForbiddenException } from '../exceptions/Forbidden.exception';
import { NotFoundException } from '../exceptions/NotFound.exception';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async getMyNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new BadRequestException('User not identified');

      const notifications = await this.notificationService.getNotificationsForUser(userId);
      res.status(200).json({ status: 'success', data: notifications });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new BadRequestException('User not identified');

      const notificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!notificationId) throw new BadRequestException('Notification ID required');

      const notifications = await this.notificationService.getNotificationsForUser(userId);
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) throw new NotFoundException('Notification not found');

      await this.notificationService.markAsRead(notificationId);
      res.status(200).json({ status: 'success', message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new BadRequestException('User not identified');

      await this.notificationService.markAllAsRead(userId);
      res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new BadRequestException('User not identified');

      const notificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!notificationId) throw new BadRequestException('Notification ID required');

      const notifications = await this.notificationService.getNotificationsForUser(userId);
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) throw new NotFoundException('Notification not found');

      await this.notificationService.deleteNotification(notificationId);
      res.status(200).json({ status: 'success', message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }

  async sendNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== RoleName.ADMIN) {
        throw new ForbiddenException('Access denied. Admin only.');
      }

      const adminId = req.user.id;
      const dto = new SendNotificationDto();
      Object.assign(dto, req.body);

      const errors = await validate(dto);
      if (errors.length > 0) {
        throw new BadRequestException('Validation failed: ' + errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; '));
      }

      const filteredUserIds = dto.userIds.filter(id => id !== adminId);
      if (filteredUserIds.length === 0) {
        throw new BadRequestException('No valid recipients (excluding yourself)');
      }

      const notifications = [];
      for (const userId of filteredUserIds) {
        const notification = await this.notificationService.createNotification({
          userId,
          type: dto.type,
          message: dto.message,
        });
        notifications.push(notification);
      }

      res.status(201).json({
        status: 'success',
        message: `Sent ${notifications.length} notifications`,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }
}