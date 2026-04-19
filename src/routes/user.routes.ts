import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authMiddleware);

// Get all users (admin only) - controller handles admin check
router.get('/', (req, res, next) => userController.getAllUsers(req, res, next));

// Get user by ID (self or admin)
router.get('/:id', (req, res, next) => userController.getUserById(req, res, next));

// Create new user (admin only)
router.post('/', (req, res, next) => userController.createUser(req, res, next));

// Update user (admin only)
router.put('/:id', (req, res, next) => userController.updateUser(req, res, next));

// Delete user (admin only)
router.delete('/:id', (req, res, next) => userController.deleteUser(req, res, next));

export default router;