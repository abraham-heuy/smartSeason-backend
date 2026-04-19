import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Field } from './Field.entity';
import { User } from './User.entity';
import { FieldStage } from './FieldStage.enum';

@Entity('field_updates')
export class FieldUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  fieldId: string;

  @ManyToOne(() => Field, (field) => field.updates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fieldId' })
  field: Field; 

  @Column({ type: 'enum', enum: FieldStage, nullable: true })
  previousStage: FieldStage | null;

  @Column({ type: 'enum', enum: FieldStage })
  newStage: FieldStage;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, (user) => user.fieldUpdates)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
}