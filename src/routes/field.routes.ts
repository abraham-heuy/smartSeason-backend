import { Router } from 'express';
import { FieldController } from '../controllers/field.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();
const fieldController = new FieldController();

router.use(authMiddleware);

// Admin only routes
router.post('/', requireRole(['admin']), fieldController.createField.bind(fieldController));
router.put('/:id', requireRole(['admin']), fieldController.updateField.bind(fieldController));
router.post('/:id/assign', requireRole(['admin']), fieldController.assignAgent.bind(fieldController));
router.delete('/:id', requireRole(['admin']), fieldController.deleteField.bind(fieldController));

// Both roles (filtered by controller logic)
router.get('/', fieldController.getAllFields.bind(fieldController));
router.get('/:id', fieldController.getFieldById.bind(fieldController));

// Agent action (add update) - accessible by both admin and agent, but controller checks assignment
router.post('/:id/updates', fieldController.addFieldUpdate.bind(fieldController));

export default router;