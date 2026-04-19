import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { validate } from 'class-validator';
import { RoleName } from '../entities/Role.entity';
import { BadRequestException } from '../exceptions/BadRequest.exception';
import { ForbiddenException } from '../exceptions/Forbidden.exception';
import { NotFoundException } from '../exceptions/NotFound.exception';
import { ConflictException } from '../exceptions/conflict.exception';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== RoleName.ADMIN) {
        throw new ForbiddenException('Access denied. Admin only.');
      }
      const users = await this.userService.getAllUsers();
      res.status(200).json({ status: 'success', data: users });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Fix: ensure userId is a string
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUser = req.user;
      
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      
      if (currentUser?.role !== RoleName.ADMIN && currentUser?.id !== userId) {
        throw new ForbiddenException('Access denied. You can only view your own profile.');
      }
      
      const user = await this.userService.findUserWithDetails(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      const { password, ...userWithoutPassword } = user;
      
      const recentActivity = user.fieldUpdates
        ?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)
        .map(update => ({
          id: update.id,
          fieldName: update.field?.name,
          previousStage: update.previousStage,
          newStage: update.newStage,
          notes: update.notes,
          createdAt: update.createdAt,
        })) || [];
      
      const assignedFields = user.assignedFields?.map(field => ({
        id: field.id,
        name: field.name,
        cropType: field.cropType,
        currentStage: field.currentStage,
        plantingDate: field.plantingDate,
        tag: field.tag,
        lastUpdate: field.updates?.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())[0],
      })) || [];
      
      res.status(200).json({
        status: 'success',
        data: {
          ...userWithoutPassword,
          recentActivity,
          assignedFields,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== RoleName.ADMIN) {
        throw new ForbiddenException('Access denied. Admin only.');
      }
      
      const createUserDto = new CreateUserDto();
      Object.assign(createUserDto, req.body);
      
      const errors = await validate(createUserDto);
      if (errors.length > 0) {
        throw new BadRequestException('Validation failed: ' + errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; '));
      }
      
      const user = await this.userService.createUser(createUserDto);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ status: 'success', data: userWithoutPassword });
    } catch (error: any) {
      if (error.message === 'User with this email already exists') {
        next(new ConflictException(error.message));
      } else {
        next(error);
      }
    }
  }

  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== RoleName.ADMIN) {
        throw new ForbiddenException('Access denied. Admin only.');
      }
      
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      
      const updateUserDto = new UpdateUserDto();
      Object.assign(updateUserDto, req.body);
      
      const errors = await validate(updateUserDto);
      if (errors.length > 0) {
        throw new BadRequestException('Validation failed: ' + errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; '));
      }
      
      const updatedUser = await this.userService.updateUser(userId, updateUserDto);
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json({ status: 'success', data: userWithoutPassword });
    } catch (error: any) {
      if (error.message === 'User not found') {
        next(new NotFoundException(error.message));
      } else {
        next(error);
      }
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== RoleName.ADMIN) {
        throw new ForbiddenException('Access denied. Admin only.');
      }
      
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      
      await this.userService.deleteUser(userId);
      res.status(200).json({ status: 'success', message: 'User deleted successfully' });
    } catch (error: any) {
      if (error.message === 'User not found') {
        next(new NotFoundException(error.message));
      } else {
        next(error);
      }
    }
  }
}