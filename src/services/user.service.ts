// src/services/user.service.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User.entity';
import { Role } from '../entities/Role.entity';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { EmailService } from './email.service';
import bcrypt from 'bcryptjs';
import { generateRandomPassword } from '../utils/helpers/password.generator';
import { FieldUpdate } from '../entities/FieldUpdate.entity';

export class UserService {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;
  private emailService: EmailService;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
    this.emailService = new EmailService();
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const role = await this.roleRepository.findOneBy({ name: createUserDto.roleName });
    if (!role) {
      throw new Error(`Role ${createUserDto.roleName} not found`);
    }

    const existingUser = await this.userRepository.findOneBy({ email: createUserDto.email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      roleId: role.id,
      firstLogin: true,
    });

    const savedUser = await this.userRepository.save(user);
    await this.emailService.sendWelcomeWithPassword(savedUser.email, savedUser.name, tempPassword);
    return savedUser;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role']
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['role']
    });
  }

  async findUserWithDetails(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['role', 'assignedFields', 'assignedFields.updates', 'fieldUpdates', 'fieldUpdates.field']
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['role'],
      select: ['id', 'name', 'email', 'firstLogin', 'createdAt', 'updatedAt', 'role']
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
      user.firstLogin = false; // password reset forces firstLogin false
    }
    if (updateUserDto.roleName) {
      const role = await this.roleRepository.findOneBy({ name: updateUserDto.roleName });
      if (!role) throw new Error(`Role ${updateUserDto.roleName} not found`);
      user.roleId = role.id;
    }

    return this.userRepository.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('User not found');
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { password: hashedPassword, firstLogin: false });
  }

  async getUserRecentActivity(userId: string, limit: number = 10): Promise<FieldUpdate[]> {
    const fieldUpdatesRepo = AppDataSource.getRepository(FieldUpdate);
    return fieldUpdatesRepo.find({
      where: { createdById: userId },
      relations: ['field'],
      order: { createdAt: 'DESC' },
      take: limit
    });
  }
}