import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

// Entities
import { Role } from '../entities/Role.entity';
import { User } from '../entities/User.entity';
import { Field } from '../entities/Field.entity';
import { FieldUpdate } from '../entities/FieldUpdate.entity';
import { Notification } from '../entities/Notification.entity';

export const AppDataSource = new DataSource({
  type: 'postgres', //used postgresql
  url: process.env.DIRECT_URL, 
  synchronize: false, // set false in production; use migrations to avoid loss of records

  logging: false,
  entities: [Role, User, Field, FieldUpdate, Notification],
  migrations: process.env.NODE_ENV === 'production'
    ? []  // Empty array in production - no dynamic imports
    : ['src/migrations/*.ts'],  // Only load in development
  migrationsRun: false,  // Never auto-run
  subscribers: [],       
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
  },
});