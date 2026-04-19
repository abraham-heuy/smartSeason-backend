// src/services/field.service.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Field } from '../entities/Field.entity';
import { FieldUpdate } from '../entities/FieldUpdate.entity';
import { User } from '../entities/User.entity';
import { CreateFieldDto, UpdateFieldDto, AssignFieldDto } from '../dtos/field.dto';
import { CreateFieldUpdateDto } from '../dtos/field-update.dto';
import { calculateFieldStatus } from '../utils/helpers/status-calculator';
import { NotificationService } from './notification.service';
import { NotificationType } from '../entities/Notification.entity';
import { FieldStage } from '../entities/FieldStage.enum';

export class FieldService {
  private fieldRepository: Repository<Field>;
  private updateRepository: Repository<FieldUpdate>;
  private userRepository: Repository<User>;

  constructor() {
    this.fieldRepository = AppDataSource.getRepository(Field);
    this.updateRepository = AppDataSource.getRepository(FieldUpdate);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createField(createFieldDto: CreateFieldDto): Promise<Field> {
    const field = this.fieldRepository.create({
      name: createFieldDto.name,
      cropType: createFieldDto.cropType,
      plantingDate: new Date(createFieldDto.plantingDate),
      currentStage: createFieldDto.currentStage || FieldStage.PLANTED,
    });
    return this.fieldRepository.save(field);
  }

  async getFieldById(id: string): Promise<Field | null> {
    return this.fieldRepository.findOne({
      where: { id },
      relations: ['assignedAgent', 'updates', 'updates.createdBy']
    });
  }

  async getAllFields(): Promise<Field[]> {
    return this.fieldRepository.find({
      relations: ['assignedAgent']
    });
  }

  async getFieldsForAgent(agentId: string): Promise<Field[]> {
    return this.fieldRepository.find({
      where: { assignedAgentId: agentId },
      relations: ['updates']
    });
  }

  async updateField(id: string, updateFieldDto: UpdateFieldDto): Promise<Field> {
    const field = await this.getFieldById(id);
    if (!field) throw new Error('Field not found');

    if (updateFieldDto.name) field.name = updateFieldDto.name;
    if (updateFieldDto.cropType) field.cropType = updateFieldDto.cropType;
    if (updateFieldDto.plantingDate) field.plantingDate = new Date(updateFieldDto.plantingDate);

    return this.fieldRepository.save(field);
  }

  async assignFieldToAgent(fieldId: string, agentId: string): Promise<Field> {
    const field = await this.getFieldById(fieldId);
    if (!field) throw new Error('Field not found');

    const agent = await this.userRepository.findOneBy({ id: agentId });
    if (!agent) throw new Error('Agent not found');

    field.assignedAgentId = agentId;
    return this.fieldRepository.save(field);
  }

  async deleteField(id: string): Promise<void> {
    const result = await this.fieldRepository.delete(id);
    if (result.affected === 0) throw new Error('Field not found');
  }

  async addFieldUpdate(fieldId: string, userId: string, dto: CreateFieldUpdateDto): Promise<FieldUpdate> {
    const field = await this.getFieldById(fieldId);
    if (!field) throw new Error('Field not found');
  
    const previousStage = field.currentStage;
    const newStage = dto.stage;
  
    // Validate stage transition order
    const stages = Object.values(FieldStage);
    const prevIndex = stages.indexOf(previousStage);
    const newIndex = stages.indexOf(newStage);
    if (newIndex < prevIndex) {
      throw new Error(`Invalid stage transition: cannot go from ${previousStage} to ${newStage}`);
    }
  
    const update = this.updateRepository.create({
      fieldId,
      previousStage,
      newStage,
      notes: dto.notes || '',
      createdById: userId,
    });
  
    // Update field current stage
    field.currentStage = newStage;
    await this.fieldRepository.save(field);
    const savedUpdate = await this.updateRepository.save(update);
  
    // Trigger notifications
    const notificationService = new NotificationService();
    const updater = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role']
    });
  
    if (updater) {
      // If updater is agent, notify all admins
      if (updater.role?.name === 'agent') {
        // Use query builder to find users with admin role
        const admins = await this.userRepository
          .createQueryBuilder('user')
          .innerJoin('user.role', 'role')
          .where('role.name = :roleName', { roleName: 'admin' })
          .getMany();
        
        for (const admin of admins) {
          await notificationService.createNotification({
            userId: admin.id,
            type: NotificationType.STAGE_UPDATED,
            message: `Field "${field.name}" stage changed from ${previousStage} to ${newStage} by ${updater.name}`,
          });
        }
      }
      // If updater is admin and field has assigned agent, notify that agent
      else if (updater.role?.name === 'admin' && field.assignedAgentId) {
        await notificationService.createNotification({
          userId: field.assignedAgentId,
          type: NotificationType.STAGE_UPDATED,
          message: `Field "${field.name}" stage changed from ${previousStage} to ${newStage} by Admin`,
        });
      }
    }
  
    return savedUpdate;
  }

  async getFieldWithDetails(id: string): Promise<any> {
    const field = await this.getFieldById(id);
    if (!field) return null;

    const status = calculateFieldStatus(field);
    const updatesWithUser = field.updates?.map(update => ({
      id: update.id,
      previousStage: update.previousStage,
      newStage: update.newStage,
      notes: update.notes,
      createdBy: update.createdBy ? { id: update.createdBy.id, name: update.createdBy.name } : null,
      createdAt: update.createdAt,
    })) || [];

    return {
      ...field,
      status,
      updates: updatesWithUser,
    };
  }
}