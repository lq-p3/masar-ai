import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/task.controller.js';
import { requireAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuthMiddleware);

router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
