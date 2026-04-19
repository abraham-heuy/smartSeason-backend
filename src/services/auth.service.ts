import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserService } from './user.service';
import { LoginDto } from '../dtos/auth.dto';

export class AuthService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async login(loginDto: LoginDto): Promise<{ user: any; token: string }> {
    const user = await this.userService.findUserByEmail(loginDto.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    await this.userService.updateUserPassword(userId, newPassword);
  }
}