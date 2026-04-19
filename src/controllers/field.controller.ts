import { Response, NextFunction } from 'express';
import { FieldService } from '../services/field.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { CreateFieldDto, UpdateFieldDto, AssignFieldDto } from '../dtos/field.dto';
import { CreateFieldUpdateDto } from '../dtos/field-update.dto';
import { validate } from 'class-validator';
import { RoleName } from '../entities/Role.entity';
import { BadRequestException } from '../exceptions/BadRequest.exception';
import { ForbiddenException } from '../exceptions/Forbidden.exception';
import { NotFoundException } from '../exceptions/NotFound.exception';

export class FieldController {
  private fieldService: FieldService;

  constructor() {
    this.fieldService = new FieldService();
  }

  // Admin: create field
  async createField(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== RoleName.ADMIN) {
        throw new ForbiddenException('Access denied. Admin only.');
      }

      const dto = new CreateFieldDto();
      Object.assign(dto, req.body);

      const errors = await validate(dto);
      if (errors.length > 0) {
        throw new BadRequestException('Validation failed: ' + errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; '));
      }

      const field = await this.fieldService.createField(dto);
      res.status(201).json({ status: 'success', data: field });
    } catch (error) {
      next(error);
    }
  }

  // Get all fields (Admin: all; Agent: only assigned)
  async getAllFields(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) throw new ForbiddenException('Not authenticated');

      let fields;
      if (user.role === RoleName.ADMIN) {
        fields = await this.fieldService.getAllFields();
      } else {
        fields = await this.fieldService.getFieldsForAgent(user.id);
      }

      res.status(200).json({ status: 'success', data: fields });
    } catch (error) {
      next(error);
    }
  }

  // Get single field with details (Admin or assigned agent)
  async getFieldById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const fieldId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!fieldId) throw new BadRequestException('Field ID required');

      const user = req.user;
      if (!user) throw new ForbiddenException('Not authenticated');

      const field = await this.fieldService.getFieldWithDetails(fieldId);
      if (!field) throw new NotFoundException('Field not found');

      // Check access: admin or assigned agent
      if (user.role !== RoleName.ADMIN && field.assignedAgentId !== user.id) {
        throw new ForbiddenException('Access denied. You are not assigned to this field.');
      }

      res.status(200).json({ status: 'success', data: field });
    } catch (error) {
      next(error);
    }
  }

  // Admin: update field metadata
  async updateField(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== RoleName.ADMIN) {
        throw new ForbiddenException('Access denied. Admin only.');
      }

      const fieldId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!fieldId) throw new BadRequestException('Field ID required');

      const dto = new UpdateFieldDto();
      Object.assign(dto, req.body);

      const errors = await validate(dto);
      if (errors.length > 0) {
        throw new BadRequestException('Validation failed: ' + errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; '));
      }

      const field = await this.fieldService.updateField(fieldId, dto);
      res.status(200).json({ status: 'success', data: field });
    } catch (error: any) {
      if (error.message === 'Field not found') next(new NotFoundException(error.message));
      else next(error);
    }
  }

  // Admin: assign agent to field
  async assignAgent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== RoleName.ADMIN) {
        throw new ForbiddenException('Access denied. Admin only.');
      }

      const fieldId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!fieldId) throw new BadRequestException('Field ID required');

      const dto = new AssignFieldDto();
      Object.assign(dto, req.body);

      const errors = await validate(dto);
      if (errors.length > 0) {
        throw new BadRequestException('Validation failed: ' + errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; '));
      }

      const field = await this.fieldService.assignFieldToAgent(fieldId, dto.agentId);
      res.status(200).json({ status: 'success', data: field });
    } catch (error: any) {
      if (error.message === 'Field not found' || error.message === 'Agent not found') {
        next(new NotFoundException(error.message));
      } else next(error);
    }
  }

  // Admin: delete field
  async deleteField(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== RoleName.ADMIN) {
        throw new ForbiddenException('Access denied. Admin only.');
      }

      const fieldId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!fieldId) throw new BadRequestException('Field ID required');

      await this.fieldService.deleteField(fieldId);
      res.status(200).json({ status: 'success', message: 'Field deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Field not found') next(new NotFoundException(error.message));
      else next(error);
    }
  }

  // Agent: add field update (stage change + notes)
  async addFieldUpdate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) throw new ForbiddenException('Not authenticated');

      const fieldId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!fieldId) throw new BadRequestException('Field ID required');

      // Check if agent is assigned to this field
      const field = await this.fieldService.getFieldById(fieldId);
      if (!field) throw new NotFoundException('Field not found');
      if (user.role !== RoleName.ADMIN && field.assignedAgentId !== user.id) {
        throw new ForbiddenException('You are not assigned to this field');
      }

      const dto = new CreateFieldUpdateDto();
      Object.assign(dto, req.body);

      const errors = await validate(dto);
      if (errors.length > 0) {
        throw new BadRequestException('Validation failed: ' + errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; '));
      }

      const update = await this.fieldService.addFieldUpdate(fieldId, user.id, dto);
      res.status(201).json({ status: 'success', data: update });
    } catch (error: any) {
      if (error.message === 'Field not found') next(new NotFoundException(error.message));
      else if (error.message.includes('Invalid stage transition')) next(new BadRequestException(error.message));
      else next(error);
    }
  }
}