import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './User.entity';

export enum RoleName {
  ADMIN = 'admin',
  AGENT = 'agent',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: RoleName, unique: true })
  name: RoleName;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}