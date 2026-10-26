import { Router } from 'express';
import { 
  getApplications, 
  getApplicationById, 
  createApplication, 
  updateApplication, 
  deleteApplication 
} from '../controllers/application.controller.js';
import { 
  validateCreateApplication, 
  validateUpdateApplication 
} from '../middleware/validation.middleware.js';

const router = Router();

router.get('/', getApplications);
router.get('/:id', getApplicationById);
router.post('/', validateCreateApplication, createApplication);
router.patch('/:id', validateUpdateApplication, updateApplication);
router.delete('/:id', deleteApplication);

export default router;
