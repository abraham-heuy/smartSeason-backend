import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
  } from 'typeorm';
import { Field } from './Field.entity';
import { FieldUpdate } from './FieldUpdate.entity';
import { Role } from './Role.entity';
import { Notification } from './Notification.entity';
 
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ length: 100 })
    name: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column()
    password: string; // hashed
  
    @Column({ default: true })
    firstLogin: boolean; // for frontend tooltip guide
  
    @Column({ type: 'uuid', nullable: false })
    roleId: string;
  
    @ManyToOne(() => Role, (role) => role.users, { eager: true })
    @JoinColumn({ name: 'roleId' })
    role: Role;
  
    @OneToMany(() => Field, (field) => field.assignedAgent)
    assignedFields: Field[];
  
    @OneToMany(() => FieldUpdate, (update) => update.createdBy)
    fieldUpdates: FieldUpdate[];
  
    @OneToMany(() => Notification, (notification) => notification.user)
    notifications: Notification[];
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }