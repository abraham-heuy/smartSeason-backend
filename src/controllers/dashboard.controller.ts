import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { RoleName } from '../entities/Role.entity';
import { ForbiddenException } from '../exceptions/Forbidden.exception';
import { BadRequestException } from '../exceptions/BadRequest.exception';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throw new BadRequestException('User not authenticated');
      }

      let dashboardData;
      if (user.role === RoleName.ADMIN) {
        dashboardData = await this.dashboardService.getAdminDashboard();
      } else if (user.role === RoleName.AGENT) {
        dashboardData = await this.dashboardService.getAgentDashboard(user.id);
      } else {
        throw new ForbiddenException('Invalid user role');
      }

      res.status(200).json({ status: 'success', data: dashboardData });
    } catch (error) {
      next(error);
    }
  }
}