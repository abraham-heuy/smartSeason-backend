import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.post('/logout', authMiddleware, authController.logout.bind(authController)); 
router.post('/change-password', authMiddleware, authController.changePassword.bind(authController));
router.get('/me', authMiddleware, authController.getMe.bind(authController));

export default router;