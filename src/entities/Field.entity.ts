import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  BeforeInsert, 
} from 'typeorm';
import { User } from './User.entity';
import { FieldUpdate } from './FieldUpdate.entity';
import { CropType } from './croptype.enum';
import { FieldStage } from './FieldStage.enum';


@Entity('fields')
export class Field {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tag: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: CropType })
  cropType: CropType;

  @Column({ type: 'date' })
  plantingDate: Date;

  @Column({ type: 'enum', enum: FieldStage, default: FieldStage.PLANTED })
  currentStage: FieldStage;

  @Column({ type: 'uuid', nullable: true })
  assignedAgentId: string | null;

  @ManyToOne(() => User, (user) => user.assignedFields, { nullable: true })
  @JoinColumn({ name: 'assignedAgentId' })
  assignedAgent: User | null;

  @OneToMany(() => FieldUpdate, (update) => update.field)
  updates: FieldUpdate[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateTag() {
    const timestamp = Math.floor(Date.now() / 1000);
    const random = Math.floor(1000 + Math.random() * 9000);
    this.tag = `FLD-${timestamp}-${random}`;
  }
}