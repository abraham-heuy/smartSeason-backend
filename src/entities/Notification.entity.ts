import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
  } from 'typeorm';
import { User } from './User.entity';
  
  export enum NotificationType {
    FIELD_ASSIGNED = 'field_assigned',
    STAGE_UPDATED = 'stage_updated',
    FIELD_AT_RISK = 'field_at_risk',
    REMINDER = 'reminder',
  }
  
  @Entity('notifications')
  export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'uuid' })
    userId: string;
  
    @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
  
    @Column({ type: 'enum', enum: NotificationType })
    type: NotificationType;
  
    @Column({ type: 'text' })
    message: string;
  
    @Column({ default: false })
    isRead: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  }