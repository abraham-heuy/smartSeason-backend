import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { AppDataSource } from './config/data-source';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import fieldRoutes from './routes/field.routes';
import notificationRoutes from './routes/notification.routes';
import userRoutes from './routes/user.routes';


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