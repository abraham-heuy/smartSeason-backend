import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { LoginDto, ChangePasswordDto } from '../dtos/auth.dto';
import { BadRequestException } from '../exceptions/BadRequest.exception';
import { validate } from 'class-validator';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }
async login(req: Request, res: Response, next: NextFunction) {
  try {
    const loginDto = new LoginDto();
    Object.assign(loginDto, req.body);
    
    const errors = await validate(loginDto);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed: ' + errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; '));
    }
    
    const result = await this.authService.login(loginDto);
    
    // Set cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.status(200).json({ status: 'success', data: { user: result.user } });
  } catch (error) {
    next(error);
  }
}
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.clearCookie('token');
      res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('User not identified');
      }
      
      const changePasswordDto = new ChangePasswordDto();
      Object.assign(changePasswordDto, req.body);
      
      const errors = await validate(changePasswordDto);
      if (errors.length > 0) {
        throw new BadRequestException('Validation failed: ' + errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; '));
      }
      
      await this.authService.changePassword(userId, changePasswordDto.currentPassword, changePasswordDto.newPassword);
      res.status(200).json({ status: 'success', message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('User not identified');
      }
      
      const user = await this.userService.findUserById(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ status: 'success', data: userWithoutPassword });
    } catch (error) {
      next(error);
    }
  }
}