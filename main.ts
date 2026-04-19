import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { AppDataSource } from './src/config/data-source';

// Import routes
import authRoutes from './src/routes/auth.routes';
import userRoutes from './src/routes/user.routes';
import fieldRoutes from './src/routes/field.routes';
import dashboardRoutes from './src/routes/dashboard.routes';
import notificationRoutes from './src/routes/notification.routes';
import { seedInitialData } from './src/utils/seed/seed';

// Import error handler
import { errorHandler } from './src/middlewares/error.middleware';

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '8080', 10);
const HOST: string = process.env.HOST || '0.0.0.0';

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Health checks
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.get('/ready', (req, res) => {
  if (AppDataSource.isInitialized) {
    res.status(200).json({ status: 'ready', database: 'connected' });
  } else {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

// API routes
app.use('/api/smartseason/auth', authRoutes);
app.use('/api/smartseason/users', userRoutes);
app.use('/api/smartseason/fields', fieldRoutes);
app.use('/api/smartseason/dashboard', dashboardRoutes);
app.use('/api/smartseason/notifications', notificationRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize database and start server
AppDataSource.initialize()
  .then(async () => {
    console.log('Database connection established');
    
    // Seed roles and default admin
   // await seedInitialData();
    
    app.listen(PORT, HOST, () => {
      console.log(`Server listening on ${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });