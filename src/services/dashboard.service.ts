import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Field } from '../entities/Field.entity';
import { User } from '../entities/User.entity';
import { FieldUpdate } from '../entities/FieldUpdate.entity';
import { calculateFieldStatus } from '../utils/helpers/status-calculator';

export class DashboardService {
  private fieldRepository: Repository<Field>;
  private userRepository: Repository<User>;
  private updateRepository: Repository<FieldUpdate>;

  constructor() {
    this.fieldRepository = AppDataSource.getRepository(Field);
    this.userRepository = AppDataSource.getRepository(User);
    this.updateRepository = AppDataSource.getRepository(FieldUpdate);
  }

  async getAdminDashboard() {
    const allFields = await this.fieldRepository.find({ relations: ['assignedAgent'] });
    
    const statusBreakdown = {
      Active: 0,
      'At Risk': 0,
      Completed: 0,
    };
    
    for (const field of allFields) {
      const status = calculateFieldStatus(field);
      statusBreakdown[status]++;
    }
    
    const recentUpdates = await this.updateRepository.find({
      relations: ['field', 'createdBy'],
      order: { createdAt: 'DESC' },
      take: 5,
    });
    
    const fieldsByAgent = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.assignedFields', 'field')
      .select('user.name', 'agent_name')
      .addSelect('COUNT(field.id)', 'field_count')
      .where('user.roleId = (SELECT id FROM roles WHERE name = :role)', { role: 'agent' })
      .groupBy('user.id')
      .getRawMany();
    
    return {
      total_fields: allFields.length,
      status_breakdown: statusBreakdown,
      recent_updates: recentUpdates.map(u => ({
        field_name: u.field.name,
        agent: u.createdBy.name,
        new_stage: u.newStage,
        notes: u.notes,
        created_at: u.createdAt,
      })),
      fields_by_agent: fieldsByAgent,
    };
  }

  async getAgentDashboard(agentId: string) {
    const assignedFields = await this.fieldRepository.find({
      where: { assignedAgentId: agentId },
      relations: ['updates'],
    });
    
    const statusBreakdown = {
      Active: 0,
      'At Risk': 0,
      Completed: 0,
    };
    
    for (const field of assignedFields) {
      const status = calculateFieldStatus(field);
      statusBreakdown[status]++;
    }
    
    const pendingActions = [];
    const now = new Date();
    for (const field of assignedFields) {
      const lastUpdate = field.updates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      if (lastUpdate) {
        const daysSinceLastUpdate = Math.floor((now.getTime() - lastUpdate.createdAt.getTime()) / (1000 * 3600 * 24));
        if (daysSinceLastUpdate > 14) {
          pendingActions.push({
            field_id: field.id,
            name: field.name,
            days_since_last_update: daysSinceLastUpdate,
          });
        }
      }
    }
    
    return {
      total_assigned_fields: assignedFields.length,
      status_breakdown: statusBreakdown,
      pending_actions: pendingActions,
    };
  }
}